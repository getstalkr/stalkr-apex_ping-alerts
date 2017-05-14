import { IncomingMessage, ServerResponse } from "http";
import micro, { json, send } from "micro";
import { GithubClient } from "./Clients/Github";
import { PusherClient } from "./Clients/Pusher";
import { Event } from "./Model/Event/";
import { Commit, User } from "./Model/Event/Github";

export class Server {

    public static readonly PORT = 3000;
    private ghClient: GithubClient;
    private pusherClient: PusherClient;
    private server: micro;

    constructor() {
      this.ghClient = new GithubClient();
      this.pusherClient = new PusherClient();
      this.server = micro(
        async (req: IncomingMessage, res: ServerResponse) => {

          const { head_commit } = await json(req);

          const { id, tree_id, message, timestamp, committer } = head_commit;
          const { name, username } = committer;
          const avatarUrl = await this.ghClient.getAvatarUrl(username);

          const event = new Event(
            new User(name, avatarUrl),
            new Commit(id, tree_id, message, timestamp),
          );

          this.pusherClient.publish(
            `${process.env.STALKR_PROJECT}@${process.env.STALKR_TEAM}`,
            "push",
            event,
          );

          return "Sent";
        },
      );
    }

    public listen(): void {
      this.server.listen(process.env.PORT || Server.PORT, () => console.log("Listening..."));
    }
}
