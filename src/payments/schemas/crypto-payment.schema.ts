// This file has been deprecated - crypto payments are now handled in the transaction schema
// with transactionType: TOP_UP and action: CRYPTO_PAYMENT
// 
// All crypto payment data is now stored directly in the Transaction model with the following fields:
// - cryptoInvoiceId, cryptoOrderNumber, cryptoCurrency, cryptoAmount
// - cryptoWalletAddress, cryptoTxnId, cryptoConfirmations, cryptoInvoiceUrl
// - cryptoActualAmount, cryptoActualCurrency, cryptoExpiresAt, cryptoCompletedAt
// - plisioWebhookData
