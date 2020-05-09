const { Customer, validateCustomer } = require('../models/customer.js');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');
const express = require('express');
const router = express.Router();

router.get('/', [auth, admin], async (req, res) => {
    const customers = await Customer.find().sort('name');
    res.send(customers);
});

router.post('/', validate(validateCustomer), async (req, res) => {
    const customer = new Customer({
        name: req.body.name,
        phone: req.body.phone,
        isGold: req.body.isGold
    });
    await customer.save();

    res.send(customer);
})

router.put('/:id', [validateObjectId, validate(validateCustomer)], async (req, res) => {
    const customer = await Customer.findByIdAndUpdate(req.params.id,
        {
            name: req.body.name,
            isGold: req.body.isGold,
            phone: req.body.phone
        }, { new: true });

    if (!customer) return res.status(404).send('The customer with the given ID was not found.');

    res.send(customer);
});

router.delete('/:id', validateObjectId, async (req, res) => {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) return res.status(404).send('The customer with the given ID was not found.');

    res.send(customer);
});

router.get('/:id', validateObjectId, async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if (!customer) return res.status(404).send('The customer with the given ID was not found.');

    res.send(customer);
});

module.exports = router;