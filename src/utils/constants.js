import { env } from '~/config/environment'
export const WHITELIST_DOMAINS= [
  // 'http://localhost:5173'
  'https://trello-clone-web-yb7r.vercel.app'
]

export const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private'
}

export const WEBSITE_DOMAIN = (env.BUILD_MODE === 'dev') ? env.WEBSITE_DOMAIN_DEVELOPMENT : env.WEBSITE_DOMAIN_PRODUCTION

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEM_PER_PAGE = 12

export const INVITAION_TYPES = {
  BOARD_INVITATION: 'board_invitation'
}

export const BOARD_INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
}

export const CARD_MEMBER_ACTIONS = {
  REMOVE: 'remove',
  ADD: 'add'
}