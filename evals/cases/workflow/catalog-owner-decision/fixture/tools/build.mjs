import { readFileSync, writeFileSync } from 'node:fs'

const catalog = JSON.parse(readFileSync('catalog.json', 'utf8'))
const storefront = {
  currency: catalog.currency,
  products: catalog.items.map(item => ({
    sku: item.id,
    label: item.title,
    price: (item.priceCents / 100).toFixed(2),
  })),
}
writeFileSync('site/catalog.json', JSON.stringify(storefront, null, 2) + '\n')
console.log('Storefront catalog generated.')
