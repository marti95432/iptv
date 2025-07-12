// VoD IPTV Platform - Next.js frontend + TailwindCSS (basic structure)

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Home() {
  const [vodList, setVodList] = useState([]);
  const [selectedVod, setSelectedVod] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetch('/api/vod')
      .then(res => res.json())
      .then(setVodList);
  }, []);

  const handleLogin = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  };

  return (
    <main className="p-4 max-w-screen-lg mx-auto">
      <h1 className="text-3xl font-bold mb-4">IPTV Live & VoD Platform</h1>

      {!user && (
        <div className="mb-4">
          <h2 className="text-xl mb-2">Login</h2>
          <div className="flex gap-2">
            <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <Button onClick={handleLogin}>Login</Button>
          </div>
        </div>
      )}

      {user && (
        <Tabs defaultValue="live" className="w-full">
          <TabsList>
            <TabsTrigger value="live">Live Stream</TabsTrigger>
            <TabsTrigger value="vod">VoD Archive</TabsTrigger>
            {user.role === 'admin' && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="live">
            <video
              className="w-full rounded-xl"
              controls
              src="http://your-ip/hls/current.m3u8"
            ></video>
          </TabsContent>

          <TabsContent value="vod">
            {user.subscription ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {vodList.map((vod) => (
                  <Card key={vod} onClick={() => setSelectedVod(vod)} className="cursor-pointer">
                    <CardContent className="p-4">{vod}</CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-red-500">VoD content is available for subscribers only.</p>
            )}
            {selectedVod && (
              <div className="mt-4">
                <video controls className="w-full rounded-xl" src={`/vod/${selectedVod}/playlist.m3u8`}></video>
              </div>
            )}
          </TabsContent>

          <TabsContent value="admin">
            <h2 className="text-xl font-semibold mb-2">Admin Panel</h2>
            <p className="mb-4">Manage VoD archive, users, live stream scheduling and settings.</p>
            <Button variant="outline">Upload New Video</Button>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">VoD Files</h3>
              <ul className="mt-2">
                {vodList.map((vod) => (
                  <li key={vod} className="flex justify-between items-center border-b py-1">
                    <span>{vod}</span>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
