import React from 'react';
import { Grid, Typography, Box, CircularProgress } from '@mui/material';
import ExamCard from './ExamCard';
import { useGetExamsQuery, useGetUserResultsQuery } from 'src/slices/examApiSlice';

const Exams = () => {
  const { data: userExams, isLoading, isError } = useGetExamsQuery();
  const { data: userResults } = useGetUserResultsQuery();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">Error fetching exams.</Typography>
      </Box>
    );
  }

  // Get set of completed exam IDs
  const completedExamIds = new Set(
    userResults?.data?.map((result) => result.examId) || []
  );

  // Separate exams into available and completed
  const availableExams = userExams.filter((exam) => !completedExamIds.has(exam.examId));
  const completedExams = userExams.filter((exam) => completedExamIds.has(exam.examId));

  return (
    <Box 
      sx={{ 
        width: '100%',
        px: { xs: 2, sm: 3, md: 4, lg: 5 },
        py: 5,
        backgroundColor: '#F8FAFC',
        minHeight: '100vh'
      }}
    >
      {/* Active Exams Section */}
      {availableExams.length > 0 && (
        <Box mb={6}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: '#1e293b',
              mb: 4,
              fontSize: { xs: '28px', md: '34px' },
              letterSpacing: '-0.5px'
            }}
          >
            Active Exams
          </Typography>
          
          <Grid container spacing={4}>
            {availableExams.map((exam) => (
              <Grid item xs={12} sm={6} md={4} key={exam._id}>
                <ExamCard exam={exam} isCompleted={false} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Previously Given Exams Section */}
      {completedExams.length > 0 && (
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: '#64748b',
              mb: 4,
              fontSize: { xs: '28px', md: '34px' },
              letterSpacing: '-0.5px'
            }}
          >
            Previous Exams
          </Typography>
          
          <Grid container spacing={4}>
            {completedExams.map((exam) => (
              <Grid item xs={12} sm={6} md={4} key={exam._id}>
                <ExamCard exam={exam} isCompleted={true} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {availableExams.length === 0 && completedExams.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography color="text.secondary" variant="h6">
            No exams available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Exams;
