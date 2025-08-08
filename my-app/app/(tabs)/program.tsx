import { View, Text, StyleSheet, FlatList } from 'react-native';

const program = [
  { id: '1', name: 'Присідання зі штангою', sets: 4, reps: 12 },
  { id: '2', name: 'Жим лежачи', sets: 3, reps: 10 },
  { id: '3', name: 'Тяга штанги в нахилі', sets: 4, reps: 12 },
  { id: '4', name: 'Підтягування', sets: 3, reps: 8 },
  { id: '5', name: 'Планка', sets: 3, reps: '1 хв' },
];

export default function ProgramScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Моя програма</Text>

      <FlatList
        data={program}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <Text>
              Підходи: {item.sets} | Повторення: {item.reps}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text>Немає доданих вправ у програму.</Text>}
      />
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
    backgroundColor: '#e6f0ff',
    borderRadius: 10,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
  },
});