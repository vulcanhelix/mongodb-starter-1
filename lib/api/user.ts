import connectToMongo from "@/lib/mongodb";

export interface UserProps {
  name: string;
  username: string;
  email: string;
  image: string;
  followers: number;
}

export interface ResultProps {
  _id: string;
  users: UserProps[];
}

export async function getUser(username: string): Promise<UserProps> {
  const client = await connectToMongo;
  const collection = client.db("test").collection("users");
  return await collection.findOne(
    { username },
    { projection: { _id: 0, emailVerified: 0 } }
  );
}

export async function getAllUsers(): Promise<ResultProps[]> {
  const client = await connectToMongo;
  const collection = client.db("test").collection("users");
  return await collection
    .aggregate([
      {
        $sort: {
          followers: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $group: {
          _id: {
            $toLower: { $substr: ["$name", 0, 1] },
          },
          users: {
            $push: {
              name: "$name",
              username: "$username",
              email: "$email",
              image: "$image",
              followers: "$followers",
            },
          },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();
}

export async function searchUser(query: string) {
  const client = await connectToMongo;
  const collection = client.db("test").collection("users");
  return await collection
    .aggregate([
      {
        $search: {
          index: "users-index",
          autocomplete: {
            query,
            path: "name",
          },
        },
      },
      {
        $sort: {
          followers: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $group: {
          _id: { $toLower: { $substr: ["$name", 0, 1] } },
          users: {
            $push: {
              name: "$name",
              username: "$username",
              email: "$email",
              image: "$image",
              followers: "$followers",
            },
          },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();
}