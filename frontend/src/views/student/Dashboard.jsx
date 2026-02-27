import React from 'react';
import { Grid, Typography, Box, Paper, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { useSelector } from 'react-redux';
import { useGetExamsQuery, useGetUserResultsQuery } from 'src/slices/examApiSlice';
import ExamCard from './Components/ExamCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Assignment, CheckCircle, Schedule, EmojiEvents } from '@mui/icons-material';
import { Helmet } from 'react-helmet';
import axiosInstance from '../../axios';

const Dashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { data: userExams } = useGetExamsQuery();
  const { data: userResults } = useGetUserResultsQuery();
  const [leaderboardData, setLeaderboardData] = React.useState([]);

  // Get completed exam IDs
  const completedExamIds = new Set(
    userResults?.data?.map((result) => result.examId) || []
  );

  // Filter only active exams
  const activeExams = userExams?.filter((exam) => !completedExamIds.has(exam.examId)) || [];

  // Fetch leaderboard data
  React.useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Get all results for ranking
        const response = await axiosInstance.get('/api/users/results');
        const allResults = response.data.data || [];
        
        // Group by exam and calculate rankings
        const examRankings = {};
        
        allResults.forEach(result => {
          const examId = result.examId;
          if (!examRankings[examId]) {
            examRankings[examId] = {
              examName: result.examName || 'Unknown Exam',
              students: []
            };
          }
          
          examRankings[examId].students.push({
            userId: result.userId,
            userName: result.userName || 'Anonymous',
            score: result.totalMarks || 0
          });
        });
        
        // Calculate rankings for each exam
        const rankings = [];
        Object.keys(examRankings).forEach(examId => {
          const exam = examRankings[examId];
          // Sort by score descending
          exam.students.sort((a, b) => b.score - a.score);
          
          // Find current user's rank
          const userRank = exam.students.findIndex(s => s.userId === userInfo?._id);
          
          if (userRank !== -1) {
            rankings.push({
              examName: exam.examName,
              rank: userRank + 1,
              totalStudents: exam.students.length,
              score: exam.students[userRank].score,
              topScore: exam.students[0].score
            });
          }
        });
        
        // Sort by rank (best ranks first)
        rankings.sort((a, b) => a.rank - b.rank);
        setLeaderboardData(rankings.slice(0, 5)); // Show top 5
        
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };
    
    if (userInfo?._id && userResults?.data?.length > 0) {
      fetchLeaderboard();
    }
  }, [userInfo, userResults]);

  // Calculate stats
  const totalExams = userExams?.length || 0;
  const completedExams = userResults?.data?.length || 0;
  const pendingExams = totalExams - completedExams;
  const averageScore = userResults?.data?.length > 0
    ? (userResults.data.reduce((sum, result) => sum + (result.totalMarks || 0), 0) / userResults.data.length).toFixed(1)
    : 0;

  // Generate performance data
  const generatePerformanceData = () => {
    if (!userResults?.data || userResults.data.length === 0) {
      return [];
    }
    
    // Sort by createdAt to get chronological order
    const sortedResults = [...userResults.data].sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    // Take last 6 results and match with exam names
    return sortedResults.slice(-6).map((result) => {
      // Find the exam name from userExams
      const exam = userExams?.find(e => e.examId === result.examId);
      return {
        exam: exam?.examName || result.examId || 'Exam',
        score: result.percentage || 0
      };
    });
  };

  const performanceData = generatePerformanceData();

  // Blue shades for bars
  const blueShades = ['#3b82f6', '#60a5fa', '#2563eb', '#1d4ed8', '#1e40af', '#93c5fd'];

  // Get rank badge color
  const getRankColor = (rank, total) => {
    const percentage = (rank / total) * 100;
    if (percentage <= 10) return '#fbbf24'; // Gold - Top 10%
    if (percentage <= 25) return '#94a3b8'; // Silver - Top 25%
    if (percentage <= 50) return '#cd7f32'; // Bronze - Top 50%
    return '#64748b'; // Default
  };

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
        <meta name="description" content="Student Dashboard" />
      </Helmet>

      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4, lg: 5 }, py: 4, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: '#3b82f6',
                fontSize: '28px',
                fontWeight: 700
              }}
            >
              {userInfo?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Welcome back, {userInfo?.name}!
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                Here's your learning progress overview
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {/* Performance Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
                Recent Performance
              </Typography>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="exam" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [`${value}%`, 'Score']}
                    />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={blueShades[index % blueShades.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    No performance data yet. Take an exam to see your progress!
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Active Exams Section */}
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#1e293b',
              mb: 3,
              fontSize: { xs: '28px', md: '32px' },
            }}
          >
            Active Exams
          </Typography>

          {activeExams.length > 0 ? (
            <Grid container spacing={4}>
              {activeExams.map((exam) => (
                <Grid item xs={12} sm={6} md={4} key={exam._id}>
                  <ExamCard exam={exam} isCompleted={false} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 5, borderRadius: '16px', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#64748b' }}>
                No active exams at the moment
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
                Check back later for new exams
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
