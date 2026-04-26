export class FlashNotAvailableError extends Error {
  constructor() {
    super('Flash is not available');
    this.name = 'FlashNotAvailableError';
  }
}

export class FlashAlreadyBookedError extends Error {
  constructor() {
    super('Flash is already booked');
    this.name = 'FlashAlreadyBookedError';
  }
}

export class BookingNotFoundError extends Error {
  constructor() {
    super('Booking not found');
    this.name = 'BookingNotFoundError';
  }
}
