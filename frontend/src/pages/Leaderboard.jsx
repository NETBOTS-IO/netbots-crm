import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star } from 'lucide-react';
import api from '@/lib/api';

const Leaderboard = () => {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const res = await api.get('/team/leaderboard');
                if (res.success) setRanking(res.data);
            } catch (err) {
                console.error("Failed to fetch leaderboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRanking();
    }, []);

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <Trophy className="text-yellow-500" size={24} />;
            case 1: return <Medal className="text-slate-400" size={24} />;
            case 2: return <Medal className="text-amber-600" size={24} />;
            default: return <span className="text-slate-400 font-bold w-6 text-center">{index + 1}</span>;
        }
    };

    if (loading) return <div>Loading leaderboard...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
                    <Star className="text-blue-500 fill-blue-500" />
                    Top Performers Leaderboard
                    <Star className="text-blue-500 fill-blue-500" />
                </h2>
                <p className="text-slate-500">Recognition for our hardest working interns and closers</p>
            </div>

            <div className="grid gap-4">
                {ranking.map((user, index) => (
                    <Card key={user._id} className={index < 3 ? "border-blue-200 bg-blue-50/50 shadow-sm" : ""}>
                        <CardContent className="flex items-center gap-6 py-4">
                            <div className="w-8 flex justify-center">{getRankIcon(index)}</div>

                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">
                                {user.name[0]}
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold text-lg">{user.name}</h3>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-[10px] uppercase">{user.role}</Badge>
                                    <Badge className="text-[10px] uppercase bg-blue-600">{user.rank?.currentRank || 'Trainee'}</Badge>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-2xl font-black text-blue-700">{user.points?.toLocaleString()}</div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Points</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
