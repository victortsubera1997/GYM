import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';

const workouts = [
  {
    id: '1',
    title: 'Кардіо інтенсив',
    date: '2025-08-06 10:00',
    coach: 'Катерина Сидоренко',
  },
  {
    id: '2',
    title: 'Функціональне тренування',
    date: '2025-08-07 12:30',
    coach: 'Олексій Іванов',
  },
  {
    id: '3',
    title: 'Силове тренування',
    date: '2025-08-08 18:00',
    coach: 'Наталія Романюк',
  },
];

export default function ScheduleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Мої тренування</Text>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>{item.date}</Text>
            <Text>Тренер: {item.coach}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>У вас немає запланованих тренувань.</Text>}
      />

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>➕ Записатись на нове</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
  },
  card: {
    padding: 15,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#3478f6',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});