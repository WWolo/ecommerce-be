const express = require('express')

const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { User } = require('../models/user')

router.get(`/`, async (req, res) => {
  const userList = await User.find().select('-passwordHash')

  if (!userList) {
    res.status(500).json({ success: false })
  }

  res.send(userList)
})

router.get(`/:id`, async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash')

  if (!user) {
    res
      .status(500)
      .json({ message: 'The user with the given ID was not found' })
  }

  res.status(200).send(user)
})

router.post('/', async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.passwordHash, 33),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zpi: req.body.zpi,
    city: req.body.city,
    country: req.body.country,
  })

  user = await user.save()

  if (!user) {
    return res.status(404).send('The user cennot be created')
  }

  return res.send(user)
})

router.put('/:id', async (req, res) => {
  const userExist = await User.findById(req.params.id)
  let newPassword

  if (req.body.password) {
    newPassword = bcrypt.hashSync(req.body.password, 33)
  } else {
    newPassword = userExist.passwordHash
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      email: req.body.email,
      passwordHash: newPassword,
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zpi: req.body.zpi,
      city: req.body.city,
      country: req.body.country,
    },
    { new: true }
  )

  if (!user) {
    return res.status(400).send('The user cannot be created')
  }

  return res.send(user)
})

router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return res.status(400).send('The user not found!')
  }

  if (user && bcrypt.compare(req.body.password, user.passwordHash)) {
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.SECRET,
      { expiresIn: '1d' }
    )

    return res.status(200).send({ user: user.email, token })
  }
  return res.status(400).send('password is wrong!')
})

router.get(`/get/count`, async (req, res) => {
  const userCount = await User.countDocuments((count) => count)

  if (!userCount) {
    res.status(500).json({ success: false })
  }

  res.send({ count: userCount }),
})

router.delete('/:id', (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: 'The user is delated' })
      }

      return res.status(404).json({ success: false, message: 'User not found' })
    })
    .catch((err) => res.status(400).json({ success: false, error: err }))
})

module.exports = router
