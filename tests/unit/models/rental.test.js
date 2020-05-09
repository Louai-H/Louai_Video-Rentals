const { Rental } = require('../../../models/rental');
const { Customer } = require('../../../models/customer');
const { Movie } = require('../../../models/movie');
const moment = require('moment');

describe('rental.return function', () => {
    it('should update the "dateReturned" to the current date and update the rentalFee acording to the dailyRentalRate & the rental days that have passed until now', () => {
        const customer = new Customer();
        const movie = new Movie({ dailyRentalRate: 2 });
        const payload = { customer, movie, dateOut: moment().subtract(7.02 * 24, 'hours').toDate() };
        const rental = new Rental(payload);

        rental.return();

        expect(moment().diff(rental.dateReturned, 'seconds')).toBeLessThan(10);
        expect(rental.rentalFee).toBe(16);
    });
});