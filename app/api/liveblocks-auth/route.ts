import { Liveblocks } from "@liveblocks/node";
import { auth, currentUser } from "@clerk/nextjs/server";

import { isExampleRoomId } from "@/lib/examples";

export async function POST(req: Request) {
  const { sessionClaims } = await auth();
  if (!sessionClaims) {
    return new Response("Not authorized", { status: 401 });
  }

  const user = await currentUser();
  if (!user) {
    return new Response("Not authorized", { status: 401 });
  }

  const { room } = await req.json();

  const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
  });

  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.fullName,
      avatar: user.imageUrl,
    },
  });
  // Example rooms back the read-only /examples pages. Storage is pre-created
  // server-side, so read-only clients never need write/init access — grant
  // READ_ACCESS so the shared example content can't be mutated over the wire.
  session.allow(
    room,
    isExampleRoomId(room) ? session.READ_ACCESS : session.FULL_ACCESS,
  );
  const { body, status } = await session.authorize();

  // Return the response
  return new Response(body, { status });
}
