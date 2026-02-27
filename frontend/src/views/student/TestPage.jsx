import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, CircularProgress } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from 'src/components/shared/BlankCard';
import MultipleChoiceQuestion from './Components/MultipleChoiceQuestion';
import NumberOfQuestions from './Components/NumberOfQuestions';
import WebCam from './Components/WebCam';
import { useGetExamsQuery, useGetQuestionsQuery } from '../../slices/examApiSlice';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import swal from 'sweetalert';

const TestPage = () => {
  const { examId, testId } = useParams();
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState(null);
  const [examDurationInSeconds, setExamDurationInSeconds] = useState(0);
  const { data: userExamdata, isLoading: isExamsLoading } = useGetExamsQuery();
  const { userInfo } = useSelector((state) => state.auth);
  const { cheatingLog, updateCheatingLog, resetCheatingLog } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMcqCompleted, setIsMcqCompleted] = useState(false);
  const [lastTabSwitchTime, setLastTabSwitchTime] = useState(0);
  const [questions, setQuestions] = useState([]);
  const { data, isLoading } = useGetQuestionsQuery(examId);
  const [score, setScore] = useState(0);

  // Initialize cheating log with exam and user info
  useEffect(() => {
    if (examId && userInfo) {
      console.log('[TestPage] 🎯 Initializing cheating log with:', {
        examId,
        username: userInfo.name,
        email: userInfo.email,
      });
      updateCheatingLog({
        examId,
        username: userInfo.name,
        email: userInfo.email,
        totalViolations: cheatingLog.totalViolations || 0,
        screenshots: cheatingLog.screenshots || [],
      });
    }
  }, [examId, userInfo]);

  // Enter fullscreen when test starts
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
        console.log('Entered fullscreen mode');
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
        toast.warning('Please enable fullscreen for better exam experience');
      }
    };

    enterFullscreen();

    // Exit fullscreen on unmount
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error('Exit fullscreen error:', err));
      }
    };
  }, []);

  useEffect(() => {
    if (userExamdata) {
      const exam = userExamdata.find((exam) => exam.examId === examId);
      if (exam) {
        setSelectedExam(exam);
        // Convert duration from minutes to seconds
        setExamDurationInSeconds(exam.duration);
        console.log('Exam duration (minutes):', exam.duration);
      }
    }
  }, [userExamdata, examId]);

  // Tab switching detection
  useEffect(() => {
    // Check total violations
    const totalViolations = cheatingLog.totalViolations || 0;

    if (totalViolations >= 5) {
      swal({
        title: 'Test Terminated!',
        text: 'You have exceeded the maximum number of violations (5). Please contact your teacher.',
        icon: 'error',
        button: 'OK',
        closeOnClickOutside: false,
      }).then(() => {
        navigate('/dashboard');
      });
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        // Debounce to prevent multiple triggers
        if (now - lastTabSwitchTime >= 2000) {
          setLastTabSwitchTime(now);
          
          // Tab switched away
          const newCount = (cheatingLog.totalViolations || 0) + 1;
          updateCheatingLog({
            ...cheatingLog,
            totalViolations: newCount,
          });
          
          // Show popup alert
          swal('Tab Switch Detected!', `Warning Recorded (Count: ${newCount})`, 'warning');
          console.log('Tab switch detected. Count:', newCount);
        }
      }
    };

    const handleBlur = () => {
      // Detect when window loses focus (Windows key, Alt+Tab, etc.)
      const now = Date.now();
      if (now - lastTabSwitchTime >= 2000) {
        setLastTabSwitchTime(now);
        
        const newCount = (cheatingLog.totalViolations || 0) + 1;
        updateCheatingLog({
            ...cheatingLog,
          totalViolations: newCount,
        });
        
        swal('Window Focus Lost!', `Warning Recorded (Count: ${newCount})`, 'warning');
        console.log('Window focus lost. Count:', newCount);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // User exited fullscreen
        const now = Date.now();
        if (now - lastTabSwitchTime >= 2000) {
          setLastTabSwitchTime(now);
          
          const newCount = (cheatingLog.totalViolations || 0) + 1;
          updateCheatingLog({
            ...cheatingLog,
            totalViolations: newCount,
          });
          
          swal('Fullscreen Exited!', `Warning Recorded (Count: ${newCount})`, 'warning');
          console.log('Fullscreen exited. Count:', newCount);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [cheatingLog, updateCheatingLog, lastTabSwitchTime, userInfo, examId, navigate, saveCheatingLogMutation]);

  useEffect(() => {
    if (data) {
      console.log('Questions loaded:', data.length, 'questions');
      console.log('Question types:', data.map(q => ({ type: q.questionType, question: q.question.substring(0, 30) })));
      setQuestions(data);
    }
  }, [data]);

  const handleMcqCompletion = () => {
    setIsMcqCompleted(true);
    // Don't reset cheating log - we want to keep violations from MCQ section
    navigate(`/exam/${examId}/codedetails`);
  };

  const handleTestSubmission = async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    try {
      setIsSubmitting(true);

      // Make sure we have the latest user info in the log
      const updatedLog = {
        ...cheatingLog,
        username: userInfo.name,
        email: userInfo.email,
        examId: examId,
        totalViolations: parseInt(cheatingLog.totalViolations) || 0,
        screenshots: cheatingLog.screenshots || [],
      };

      console.log('[TestPage] 📤 Submitting cheating log:', updatedLog);

      // Save the cheating log
      const result = await saveCheatingLogMutation(updatedLog).unwrap();
      console.log('[TestPage] ✅ Cheating log saved successfully:', result);

      toast.success('Test submitted successfully!');
      navigate('/Success');
    } catch (error) {
      console.error('[TestPage] Error saving cheating log:', error);
      console.error('[TestPage] Error details:', error.data, error.status);
      toast.error(
        error?.data?.message || error?.message || 'Failed to save test logs. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveUserTestScore = () => {
    setScore(score + 1);
  };

  if (isExamsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PageContainer title="TestPage" description="This is TestPage">
      <Box pt="3rem">
        <Grid container spacing={3}>
          <Grid item xs={12} md={7} lg={7}>
            <BlankCard>
              <Box
                width="100%"
                minHeight="400px"
                boxShadow={3}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
              >
                {isLoading ? (
                  <CircularProgress />
                ) : (
                  <MultipleChoiceQuestion
                    submitTest={isMcqCompleted ? handleTestSubmission : handleMcqCompletion}
                    questions={data}
                    saveUserTestScore={saveUserTestScore}
                  />
                )}
              </Box>
            </BlankCard>
          </Grid>
          <Grid item xs={12} md={5} lg={5}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <BlankCard>
                  <Box
                    maxHeight="300px"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'start',
                      justifyContent: 'center',
                      overflowY: 'auto',
                      height: '100%',
                    }}
                  >
                    <NumberOfQuestions
                      questionLength={questions.length}
                      submitTest={isMcqCompleted ? handleTestSubmission : handleMcqCompletion}
                      examDurationInSeconds={examDurationInSeconds}
                    />
                  </Box>
                </BlankCard>
              </Grid>
              <Grid item xs={12}>
                <BlankCard>
                  <Box
                    width="300px"
                    maxHeight="180px"
                    boxShadow={3}
                    display="flex"
                    flexDirection="column"
                    alignItems="start"
                    justifyContent="center"
                  >
                    <WebCam cheatingLog={cheatingLog} updateCheatingLog={updateCheatingLog} />
                  </Box>
                </BlankCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default TestPage;
