import express from 'express';
import { createServer } from 'http';
import { PubSub } from 'graphql-subscriptions';
import gql from 'graphql-tag';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import bodyParser from 'body-parser';

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
      placeHolder: () => {
        return true;
      },
    },
    Mutation: {
      createNewsEvent: (_parent: any, args: createNewsEventInput) => {
        console.log(args);
        pubSub.publish('EVENT_CREATED', { newsFeed: args });
        // Persist to DB can go here...
        return args;
      },
    },
    Subscription: {
      newsFeed: {
        subscribe: () => pubSub.asyncIterator(['EVENT_CREATED']),
      },
    },
  };

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Start websocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql', // localhost:3000/graphql
  });

  const serverCleanup = useServer({ schema }, wsServer); // dispose / teardown server

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  // Start Server
  await server.start();

  // Apply middlewares (cors, express)
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    expressMiddleware(server)
  );

  // HttpServer start
  httpServer.listen(4000, () => {
    console.log("Server running on http://localhost:4000/graphql")
  });

})();
