import { api } from './client'

export const getAuction = (id) => api.get(`/auctions/show.php?id=${id}`)
export const placeBid = (auctionId, amount) => api.post('/auctions/bid.php', { auction_id: auctionId, amount })
