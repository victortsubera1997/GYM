import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

type LogItem = {
  _id: string;
  title: string;
  notes?: string;
  dateTime: string; // ISO
};

export default function ProgramScreen() {
  const { isAuthenticated } = useAuth();

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // form
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const listRef = useRef<FlatList<LogItem>>(null);
  const inputsWrapRef = useRef<View>(null);

  const fetchLogs = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get('/api/program/logs'); // GET
      const items: LogItem[] = res.data?.items ?? [];
      // нові зверху
      items.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      setLogs(items);
    } catch (e: any) {
      console.log('fetch logs error', e?.response?.data || e?.message);
      Alert.alert('Помилка', 'Не вдалося завантажити записи');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = async () => {
    const t = title.trim();
    const n = notes.trim();
    if (!t) {
      Alert.alert('Увага', 'Введіть назву вправи/запису');
      return;
    }
    setAdding(true);
    try {
      const payload = {
        title: t,
        notes: n || undefined,
        dateTime: new Date().toISOString(),
      };
      const res = await api.post('/api/program/logs', payload); // POST
      const item: LogItem = res.data?.item;
      if (item?._id) {
        setLogs((prev) => [item, ...prev]);
        setTitle('');
        setNotes('');
        // прокрутити до верху, щоб показати новий запис
        requestAnimationFrame(() => {
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        });
        Keyboard.dismiss();
      } else {
        throw new Error('bad response');
      }
    } catch (e: any) {
      console.log('save log error', e?.response?.data || e?.message);
      Alert.alert('Помилка', 'Не вдалося зберегти тренування');
    } finally {
      setAdding(false);
    }
  };

  const removeLog = async (id: string) => {
    Alert.alert('Видалити запис?', 'Цю дію не можна скасувати.', [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: async () => {
          setRemovingId(id);
          try {
            await api.delete(`/api/program/logs/${id}`); // DELETE
            setLogs((prev) => prev.filter((x) => x._id !== id));
          } catch (e: any) {
            console.log('delete log error', e?.response?.data || e?.message);
            Alert.alert('Помилка', 'Не вдалося видалити запис');
          } finally {
            setRemovingId(null);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: LogItem }) => {
    const date = new Date(item.dateTime);
    const when =
      isNaN(date.getTime()) ? '-' : `${date.toLocaleDateString('uk-UA')} ${date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => removeLog(item._id)}
            disabled={removingId === item._id}
          >
            <Text style={styles.deleteTxt}>{removingId === item._id ? '…' : '×'}</Text>
          </TouchableOpacity>
        </View>
        {!!item.notes && <Text style={styles.cardNotes}>{item.notes}</Text>}
        <Text style={styles.cardMeta}>{when}</Text>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.muted}>Будь ласка, увійдіть у систему</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* Форма додавання */}
        <ScrollView
          ref={inputsWrapRef as any}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.formWrap}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Щоденник тренувань</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Вправа / назва запису</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Напр., Жим лежачи 3×10"
              placeholderTextColor="#6b7280"
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Нотатки (необов’язково)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Вага, самопочуття, зауваження…"
              placeholderTextColor="#6b7280"
              style={[styles.input, styles.inputMultiline]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={[styles.primaryBtn, adding && { opacity: 0.7 }]} onPress={addLog} disabled={adding}>
            <Text style={styles.primaryBtnText}>{adding ? 'Збереження…' : 'Додати запис'}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Список логів */}
        {loading ? (
          <View style={[styles.center, { paddingVertical: 24 }]}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={logs}
            keyExtractor={(i) => i._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={[styles.center, { paddingVertical: 16 }]}>
                <Text style={styles.muted}>Поки що немає записів</Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ===== Styles (темна тема дружня) ===== */
const BG = '#0B1220';
const CARD = '#0F172A';
const BORDER = '#1F2937';
const TEXT = '#E5E7EB';
const MUTED = '#9CA3AF';
const ACCENT = '#3B82F6';
const DANGER = '#EF4444';
const INPUT = '#0E141D';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  center: { alignItems: 'center', justifyContent: 'center' },

  heading: {
    color: TEXT,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },

  formWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  inputGroup: { marginBottom: 12 },
  label: { color: MUTED, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    color: TEXT,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 84,
  },
  primaryBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { color: TEXT, fontSize: 16, fontWeight: '700', flex: 1 },
  cardNotes: { color: TEXT, marginTop: 6, lineHeight: 20 },
  cardMeta: { color: MUTED, marginTop: 8, fontSize: 12 },

  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111827',
    borderColor: BORDER,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTxt: { color: DANGER, fontSize: 18, lineHeight: 20, fontWeight: '800' },
});