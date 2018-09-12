import { UserData } from '../model/userdata'
import { getLinkId } from '../model/getLinkId'
import { isValidRating } from '../model/invariants/isValidRating'
import { EventStore } from '../databases/eventstore/eventStore'

type RateLink = {
  linkUrl?: string
  title?: string
  rating?: number
  image?: string
  tags?: string[]
}

export const linkCommandHandlers = (
  eventStore: EventStore,
  user: UserData
) => ({
  rate: async (params: RateLink) => {
    const linkId = getLinkId(user, params.linkUrl)
    const linkEvents = await eventStore.getById(linkId, {
      returnEmptyArrOn404: true
    })

    return eventStore.save({
      events: [
        linkEvents.length === 0 && {
          type: 'LINK_CREATED',
          payload: {
            linkId,
            linkUrl: params.linkUrl,
            userId: user.userId
          }
        },
        params.title && {
          type: 'LINK_TITLE_UPDATED',
          payload: {
            linkId,
            title: params.title,
            userId: user.userId
          }
        },
        params.image && {
          type: 'LINK_IMAGE_UPDATED',
          payload: {
            linkId,
            image: params.image,
            userId: user.userId
          }
        },
        params.rating &&
          isValidRating(params.rating) && {
            type: 'LINK_RATED',
            payload: {
              linkId,
              rating: params.rating,
              userId: user.userId
            }
          },
        params.tags && {
          type: 'LINK_TAGGED',
          payload: {
            linkId,
            tags: params.tags,
            userId: user.userId
          }
        }
      ],
      streamId: linkId,
      expectedVersion: linkEvents.length
    })
  }
})