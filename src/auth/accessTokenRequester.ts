export type AccessTokenCallbacks = {
  onToken: (accessToken: string) => void
  onError: (message: string) => void
}

export type AccessTokenRequester = {
  requestAccessToken: () => void
}

/* The single seam over Google Identity Services: everything above it is faked in
   tests, so no test ever reaches for the `google` global. */
export type CreateAccessTokenRequester = (
  callbacks: AccessTokenCallbacks,
) => AccessTokenRequester
