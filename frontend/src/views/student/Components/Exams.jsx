import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from '../../../components/shared/BlankCard';
import ExamCard from './ExamCard';
import { useGetExamsQuery, useGetUserResultsQuery } from 'src/slices/examApiSlice';

const Exams = () => {
  // Fetch exam data from the backend using useGetExamsQuery
  const { data: userExams, isLoading, isError } = useGetExamsQuery();
  const { data: userResults } = useGetUserResultsQuery();
  
  console.log('Exam USer ', userExams);

  if (isLoading) {
    return <div>Loading...</div>; // You can replace this with a loading spinner component
  }

  if (isError) {
    return <div>Error fetching exams.</div>; // You can handle errors more gracefully
  }

  // Get set of completed exam IDs
  const completedExamIds = new Set(
    userResults?.data?.map((result) => result.examId) || []
  );

  // Separate exams into available and completed
  const availableExams = userExams.filter((exam) => !completedExamIds.has(exam.examId));
  const completedExams = userExams.filter((exam) => completedExamIds.has(exam.examId));

  return (
    <PageContainer title="Exams" description="List of exams">
      {/* Available Exams Section */}
      {availableExams.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" mb={2}>
            Available Exams
          </Typography>
          <Grid container spacing={3}>
            {availableExams.map((exam) => (
              <Grid item sm={6} md={4} lg={3} key={exam._id}>
                <BlankCard>
                  <ExamCard exam={exam} isCompleted={false} />
                </BlankCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Previously Given Exams Section */}
      {completedExams.length > 0 && (
        <Box>
          <Typography variant="h5" mb={2}>
            Previously Given Exams
          </Typography>
          <Grid container spacing={3}>
            {completedExams.map((exam) => (
              <Grid item sm={6} md={4} lg={3} key={exam._id}>
                <BlankCard>
                  <ExamCard exam={exam} isCompleted={true} />
                </BlankCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </PageContainer>
  );
};

export default Exams;
