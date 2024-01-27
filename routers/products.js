const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const { Product } = require('../models/product')
const { Category } = require('../models/category')

const router = express.Router()

const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype]
    let uploadError = new Error('invalid image type')

    if (isValid) {
      uploadError = null
    }

    cb(uploadError, '/public/uploads')
  },
  filename(req, file, cb) {
    const fileName = file.originalname.split(' ').join('-')
    const extension = FILE_TYPE_MAP[file.mimetype]

    cb(null, `${fileName}-${Date.now()}.${extension}`)
  },
})

const uploadOptions = multer({ storage })

router.get(`/`, async (req, res) => {
  let filter = {}
  if (req.query.categories) {
    filter = { category: req.query.categories.split(',') }
  }

  const productList = await Product.find({ filter }).populate('category')

  if (!productList) {
    res.status(500).json({ success: false })
  }

  res.send(productList)
})

router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category')

  if (!product) {
    res.status(500).json({ success: false })
  }

  res.send(product)
})

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
  const category = await Category.findById(req.body.category)

  if (!category) {
    return res.status(400).send('Invalid Category')
  }

  const fileName = req.file.filename
  const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`

  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    dateCreated: req.body.dateCreated,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  })

  product = await product.save()

  if (!product) {
    return res.status(500).send('The product cannot be created')
  }

  return res.send(product)
})

router.put('/:id', async (req, res) => {
  if (mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send('Invalid Product Id')
  }

  const category = await Category.findById(req.body.category)

  if (!category) {
    return res.status(400).send('Invalid Category')
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: req.body.image,
      images: req.body.images,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      dateCreated: req.body.dateCreated,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  )

  if (!product) {
    return res.status(400).send('The product cannot be updated')
  }

  return res.send(product)
})

router.delete('/:id', (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then(product => {
      if (product) {
        return res.status(200).json({ success: true, message: 'The product is delated' })
      }

      return res.status(404).json({ success: false, message: 'Product not found' })
    })
    .catch(err => res.status(400).json({ success: false, error: err }))
})

router.get(`/get/count`, async (req, res) => {
  const productCount = await Product.countDocuments(count => count)

  if (!productCount) {
    res.status(500).json({ success: false })
  }

  res.send({ count: productCount })
})

router.get(`/get/featured/:count`, async (req, res) => {
  const count = req.params.count ? req.params.count : 0
  const products = await Product.find({ isFeatured: true }).limit(+count)

  if (!products) {
    res.status(500).json({ success: false })
  }

  res.send(products)
})

module.exports = router
