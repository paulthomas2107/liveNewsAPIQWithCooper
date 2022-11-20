import express from 'express';
import { createServer } from 'http';
import { PubSub } from 'graphql-subscriptions';
import gql from 'graphql-tag';

(async function () {
    // Server
    const pubSub = new PubSub();
    const app = express();
    const httpServer = createServer(app)
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
            createNewsEvent(title: String, description: String) : NewsEvent
        }

        type Subscription {
            newsFeed: NewsEvent
        }
    `


})();