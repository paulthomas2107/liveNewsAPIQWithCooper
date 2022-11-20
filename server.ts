import express from 'express';
import { createServer } from 'http';
import { PubSub } from 'graphql-subscriptions';
import gql from 'graphql-tag';

(async function () {
  // Server
  const pubSub = new PubSub();
  const app = express();
  const httpServer = createServer(app);
  // GraphQL defs and resolvers
  const typeDefs = gql`
    type NewsEvent {
      title: String
      description: String
    }

    type Query {
      placeHolder: Boolean
    }

    type Mutation {
      createNewsEvent(title: String, description: String): NewsEvent
    }

    type Subscription {
      newsFeed: NewsEvent
    }
  `;

  interface createNewsEventInput {
    title: String;
    description: String;
  }

  const resolvers = {
    Query: {
      placeholder: () => {
        return true;
      },
    },
    Mutation: {
      createNewsEvent: (_parent: any, args: createNewsEventInput) => {
        console.log(args)
        pubSub.publish('EVENT_CREATED', {newsFeed: args})
        // Persist to DB can go here...
        return args
      },
    },
    Subscription: {
        newsFeed: {
            subscribe: () => pubSub.asyncIterator(['EVENT_CREATED'])
        }
    }
  };
  // Start websocket server
  // Create Apollo Server
  // Start Server
  // Apply middlewares (cors, express)
  // HttpServer start

})();
