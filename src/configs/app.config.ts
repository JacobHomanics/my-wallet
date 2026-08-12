export const appConfig = {
  tax: {
    /** Service fee when gas sponsorship is on (fraction of merchant payment). */
    sponsoredRate: 0.5,
    /** Service fee when the payer covers network fees (fraction of merchant payment). */
    unsponsoredRate: 0.1,
    evmAddress: '0xe80A48BcA9552d5DC6567841CdD5d0F870C4b98B',
    solanaAddress: '7VrowyBktQbGiiZuL3cb2DZAVtGWCyDonT2BUcCAz7Ve',
  },
} as const;
