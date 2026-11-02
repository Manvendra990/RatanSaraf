# Manual KYC

Follow START_HERE.md for the current update/install steps. Preserve your existing KYC_ENCRYPTION_KEY and database; do not regenerate an active key or reset data.

Personal details and PAN files are encrypted at rest with AES-256-GCM and only fetched through authenticated owner/admin endpoints. New submissions enter PENDING (yellow). The admin checks details and the private document, then approves (green) or rejects with a correction note. The submission version prevents a stale review from approving a resubmission. Rejected users can resubmit; pending or approved users cannot replace the document.

Approval unlocks direct Gold Buy & Sell. It is manual store review, not external Aadhaar/PAN API certification. The optional external verification adapter remains separate to preserve earlier verified states.

JPEG/PNG/PDF documents up to 5 MB are supported. Keep backups of the encryption key securely. No automatic document-retention deletion job is included. For an installation with no KYC key yet, backend npm run kyc:key generates one without printing it; it preserves an existing valid key.
