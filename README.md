# Style Empire

Website for Style Empire, the hair salon at 193 St Peter's Avenue, Kettering, NN16 0HE.

The pages are Home, About, Services, Contact, Book, and Privacy. Copy is based on the public Google listing, Companies House company 11970937, and the salon's own photos. Prices are not invented. The hours follow Google, not the older times printed on the front door.

## Develop

```bash
bash scripts/cloud-agent-install.sh
bash .cursor/start.sh
```

The site runs at http://localhost:4321. Mailpit catches mail at http://127.0.0.1:8025. It does not send mail to the real salon.

`PAYMENT_MODE=demo` lets you finish "pay online" without a card. No money is taken. Set `PAYMENT_MODE=stripe` and `STRIPE_SECRET_KEY` only when a service has a real `pricePence` value.

## Checks

```bash
npm test
npm run check
npm run build
```
