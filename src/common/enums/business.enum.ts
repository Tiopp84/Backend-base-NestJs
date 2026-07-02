export enum BookingStatus {
  Pending = 'PENDING',
  Confirmed = 'CONFIRMED',
  Cancelled = 'CANCELLED',
}

export enum InvoiceStatus {
  Pending = 'PENDING',
  Paid = 'PAID',
  Refunded = 'REFUNDED',
}

export enum OrderStatus {
  Pending = 'PENDING',
  Delivered = 'DELIVERED',
}

export enum PaymentMethod {
  Cash = 'CASH',
  Transfer = 'TRANSFER',
  Card = 'CARD',
}

export enum BookingEmployeeRole {
  Main = 'MAIN',
  Assistant = 'ASSISTANT',
}
