import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface PriceBreakdownProps {
  totalPrice: number
  netPrice: number
}

function formatEur(value: number): string {
  return value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

export default function PriceBreakdown({ totalPrice, netPrice }: PriceBreakdownProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Totale lordo</Text>
        <Text style={styles.totalValue}>{formatEur(totalPrice)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.label}>Netto (80%)</Text>
        <Text style={styles.netValue}>{formatEur(netPrice)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 14,
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#bbf7d0',
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  netValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
})
