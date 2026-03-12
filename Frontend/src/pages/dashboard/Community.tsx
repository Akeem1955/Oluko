import { motion } from 'framer-motion';
import { Users, MessageSquare, Trophy, TrendingUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';

const LEADERBOARD = [
    { rank: 1, name: 'Sarah Chen', points: 2450, avatar: 'https://i.pravatar.cc/150?img=1' },
    { rank: 2, name: 'Mike Johnson', points: 2320, avatar: 'https://i.pravatar.cc/150?img=2' },
    { rank: 3, name: 'Alex Kim', points: 2180, avatar: 'https://i.pravatar.cc/150?img=3' },
    { rank: 4, name: 'Emma Wilson', points: 1950, avatar: 'https://i.pravatar.cc/150?img=4' },
    { rank: 5, name: 'You', points: 1840, avatar: '', isCurrentUser: true },
];

const DISCUSSIONS = [
    { id: '1', title: 'Tips for understanding calculus limits?', replies: 24, author: 'Sarah Chen' },
    { id: '2', title: 'Best resources for Python beginners', replies: 18, author: 'Mike Johnson' },
    { id: '3', title: 'Study group for physics exam', replies: 12, author: 'Emma Wilson' },
];

export default function Community() {
    return (
        <AppLayout>
            <div className="max-w-[1440px] mx-auto p-6 lg:p-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Connect with fellow learners</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2"
                    >
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Discussions</h2>
                            </div>
                            <div className="space-y-4">
                                {DISCUSSIONS.map((discussion) => (
                                    <div
                                        key={discussion.id}
                                        className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    >
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{discussion.title}</h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>by {discussion.author}</span>
                                            <span>•</span>
                                            <span>{discussion.replies} replies</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leaderboard</h2>
                            </div>
                            <div className="space-y-3">
                                {LEADERBOARD.map((user) => (
                                    <div
                                        key={user.rank}
                                        className={`flex items-center gap-3 p-3 rounded-xl ${user.isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-gray-50 dark:bg-gray-800'
                                            }`}
                                    >
                                        <span className={`w-6 text-center font-bold ${user.rank <= 3 ? 'text-yellow-500' : 'text-gray-400'}`}>
                                            {user.rank}
                                        </span>
                                        <Avatar src={user.avatar} alt={user.name} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate ${user.isCurrentUser ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                                                {user.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-bold text-gray-600 dark:text-gray-300">
                                            <TrendingUp className="w-4 h-4" />
                                            {user.points}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    {[
                        { label: 'Active Members', value: '12.5K', icon: Users },
                        { label: 'Discussions', value: '3.2K', icon: MessageSquare },
                        { label: 'This Week', value: '+245', icon: TrendingUp },
                        { label: 'Your Rank', value: '#5', icon: Trophy },
                    ].map((stat, i) => (
                        <Card key={i} className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                <p className="text-xs text-gray-500">{stat.label}</p>
                            </div>
                        </Card>
                    ))}
                </motion.div>
            </div>
        </AppLayout>
    );
}
