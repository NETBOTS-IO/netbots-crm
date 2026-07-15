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
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center space-y-1">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center justify-center gap-2">
                    <Trophy className="text-slate-400" size={20} />
                    Top Performers Leaderboard
                </h2>
                <p className="text-xs text-slate-500 font-medium">Recognition for our hardest working interns and closers</p>
            </div>

            <div className="grid gap-3">
                {ranking.map((user, index) => (
                    <Card key={user._id} className={index < 3 ? "border-slate-350 bg-slate-50/30" : "border-slate-200"}>
                        <CardContent className="flex items-center gap-4 py-3 px-4">
                            <div className="w-8 flex justify-center">{getRankIcon(index)}</div>

                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 border border-slate-200">
                                {user.name[0]}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base text-slate-900 truncate">{user.name}</h3>
                                <div className="flex gap-1.5 mt-1">
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 uppercase font-medium text-slate-500 border-slate-200">{user.role}</Badge>
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 uppercase font-medium bg-slate-950 text-white border-slate-950">{user.rank ? user.rank.replace('_', ' ') : 'Trainee'}</Badge>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xl font-semibold text-slate-900">{user.points?.toLocaleString()}</div>
                                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Points</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
