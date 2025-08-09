import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

type Item = {
  _id: string;
  title: string;
  dateTime: string; // ISO
  notes?: string;
};

type FormState = {
  title: string;
  date: Date;        // тільки дата
  time: Date | null; // час опційний
  notes: string;
};

const fmtDate = (d: Date) =>
  d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

const isoDate = (d: Date) => d.toISOString().substring(0, 10);
const isoTime = (d: Date) =>
  `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

export default function ScheduleScreen() {
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Модалка створення
  const [open, setOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<null | 'date' | 'time'>(null);

  const [form, setForm] = useState<FormState>(() => ({
    title: '',
    date: new Date(),
    time: null,
    notes: '',
  }));

  // Загрузка списку
  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/api/schedule');
      setItems(res.data?.items ?? []);
    } catch (e) {
      console.log('fetch schedule error', e);
      Alert.alert('Помилка', 'Не вдалося завантажити записи');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Розбиття на майбутні/минулі
  const now = Date.now();
  const { future, past } = useMemo(() => {
    const f: Item[] = [];
    const p: Item[] = [];
    items.forEach((it) => (new Date(it.dateTime).getTime() >= now ? f : p).push(it));
    return {
      future: f.sort((a, b) => +new Date(a.dateTime) - +new Date(b.dateTime)),
      past: p.sort((a, b) => +new Date(b.dateTime) - +new Date(a.dateTime)),
    };
  }, [items, now]);

  const openCreate = () => {
    setForm({ title: '', date: new Date(), time: null, notes: '' });
    setOpen(true);
  };
  const closeCreate = () => setOpen(false);

  // Пікери
  const onChangeDate = (_: DateTimePickerEvent, value?: Date) => {
    if (value) setForm((s) => ({ ...s, date: value }));
    setShowDatePicker(null);
  };
  const onChangeTime = (_: DateTimePickerEvent, value?: Date) => {
    if (value) setForm((s) => ({ ...s, time: value }));
    setShowDatePicker(null);
  };

  const clearTime = () => setForm((s) => ({ ...s, time: null }));

  // Збереження
  const save = async () => {
    const title = form.title.trim();
    if (!title) return Alert.alert('Помилка', 'Вкажіть назву');

    try {
      const payload: any = {
        title,
        date: isoDate(form.date),
        notes: form.notes.trim(),
      };
      if (form.time) payload.time = isoTime(form.time); // час не обовʼязковий
      await api.post('/api/schedule', payload);
      closeCreate();
      setLoading(true);
      loadData();
    } catch (e) {
      console.log('create schedule error', e);
      Alert.alert('Помилка', 'Не вдалося зберегти тренування');
    }
  };

  // Видалення
  const del = (id: string) => {
    Alert.alert('Видалити тренування?', 'Цю дію неможливо скасувати.', [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/schedule/${id}`);
            setItems((prev) => prev.filter((x) => x._id !== id));
          } catch (e) {
            console.log('delete error', e);
            Alert.alert('Помилка', 'Не вдалося видалити');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSub}>
          {new Date(item.dateTime).toLocaleString('uk-UA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {!!item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
      </View>
      <Pressable onPress={() => del(item._id)} style={styles.delBtn} accessibilityLabel="Видалити">
        <Text style={{ color: 'white', fontWeight: '800' }}>×</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Мої тренування</Text>
        <Pressable style={styles.primary} onPress={openCreate} accessibilityRole="button">
          <Text style={styles.primaryText}>Додати</Text>
        </Pressable>
      </View>

      <FlatList
        data={[{ key: 'future' }, { key: 'past' }]}
        keyExtractor={(s) => s.key}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          if (item.key === 'future') {
            return (
              <>
                <Text style={styles.section}>Майбутні</Text>
                {future.length ? (
                  future.map((x) => <View key={x._id}>{renderItem({ item: x })}</View>)
                ) : (
                  <Text style={styles.empty}>Немає запланованих тренувань</Text>
                )}
              </>
            );
          }
          return (
            <>
              <Text style={styles.section}>Минули</Text>
              {past.length ? (
                past.map((x) => <View key={x._id}>{renderItem({ item: x })}</View>)
              ) : (
                <Text style={styles.empty}>Історія поки порожня</Text>
              )}
            </>
          );
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        removeClippedSubviews
        windowSize={5}
        maxToRenderPerBatch={8}
      />

      {/* МОДАЛКА СТВОРЕННЯ */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={closeCreate}
      >
        <TouchableWithoutFeedback onPress={closeCreate}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrap}
        >
          <ScrollView
            contentContainerStyle={styles.modalCard}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.handle} />

            <Text style={styles.modalTitle}>Нове тренування</Text>

            <Text style={styles.label}>Назва</Text>
            <TextInput
              value={form.title}
              onChangeText={(v) => setForm((s) => ({ ...s, title: v.slice(0, 64) }))}
              placeholder="Напр., Спина + біг"
              placeholderTextColor="#9aa0a6"
              style={styles.input}
              returnKeyType="done"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Дата</Text>
                <Pressable
                  style={styles.inputBtn}
                  onPress={() => setShowDatePicker('date')}
                  accessibilityRole="button"
                >
                  <Text style={styles.inputBtnText}>{fmtDate(form.date)}</Text>
                </Pressable>
              </View>

              <View style={{ width: 12 }} />

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Час (необов’язково)</Text>
                <Pressable
                  style={styles.inputBtn}
                  onPress={() => setShowDatePicker('time')}
                  accessibilityRole="button"
                >
                  <Text style={styles.inputBtnText}>
                    {form.time ? fmtTime(form.time) : '—'}
                  </Text>
                </Pressable>
                {form.time && (
                  <Pressable style={styles.clearTime} onPress={clearTime}>
                    <Text style={styles.clearTimeText}>Очистити час</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <Text style={styles.label}>Нотатки (необовʼязково)</Text>
            <TextInput
              value={form.notes}
              onChangeText={(v) => setForm((s) => ({ ...s, notes: v.slice(0, 500) }))}
              placeholder="План, самопочуття…"
              placeholderTextColor="#9aa0a6"
              style={[styles.input, { height: 110, textAlignVertical: 'top' }]}
              multiline
            />

            <View style={styles.actions}>
              <Pressable style={styles.secondary} onPress={closeCreate}>
                <Text style={styles.secondaryText}>Скасувати</Text>
              </Pressable>
              <Pressable style={styles.primary} onPress={save}>
                <Text style={styles.primaryText}>Зберегти</Text>
              </Pressable>
            </View>

            {/* ПІКЕРИ */}
            {showDatePicker === 'date' && (
              <DateTimePicker
                mode="date"
                value={form.date}
                onChange={onChangeDate}
                minimumDate={new Date()}
              />
            )}
            {showDatePicker === 'time' && (
              <DateTimePicker
                mode="time"
                value={form.time ?? new Date()}
                onChange={onChangeTime}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B1220' },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: { fontSize: 22, fontWeight: '800', color: '#E6EAF2' },

  section: {
    color: '#9aa0a6',
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '700',
  },
  empty: { color: '#9aa0a6', marginBottom: 12 },

  card: {
    backgroundColor: '#0E141D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E2A3A',
    flexDirection: 'row',
    gap: 10,
  },
  cardTitle: { color: '#E6EAF2', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  cardSub: { color: '#C2C8D0' },
  cardNotes: { color: '#9aa0a6', marginTop: 6, fontStyle: 'italic' },
  delBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d9534f',
    alignSelf: 'flex-start',
  },

  // Buttons
  primary: {
    backgroundColor: '#3478f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondary: {
    borderWidth: 1,
    borderColor: '#2b3647',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryText: { color: '#E6EAF2', fontWeight: '700' },

  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#0E141D',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#1E2A3A',
    gap: 10,
  },
  handle: {
    width: 60,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    backgroundColor: '#243245',
    marginBottom: 6,
  },
  modalTitle: { color: '#E6EAF2', fontWeight: '800', fontSize: 22, marginBottom: 6 },

  label: { color: '#9aa0a6', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#0E141D',
    borderWidth: 1,
    borderColor: '#1E2A3A',
    color: '#E6EAF2',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  inputBtn: {
    backgroundColor: '#0E141D',
    borderWidth: 1,
    borderColor: '#1E2A3A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  inputBtnText: { color: '#E6EAF2', fontSize: 16 },
  clearTime: { marginTop: 6, alignSelf: 'flex-start' },
  clearTimeText: { color: '#86a0ff' },

  row: { flexDirection: 'row', alignItems: 'center' },
  actions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
});