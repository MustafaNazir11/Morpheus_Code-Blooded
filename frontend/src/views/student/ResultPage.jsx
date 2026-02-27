import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Code, Visibility, VisibilityOff, Search, CheckCircle, Download, PictureAsPdf } from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import axiosInstance from '../../axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const ResultPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedResult, setSelectedResult] = useState(null);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all exams first
        const examsResponse = await axiosInstance.get('/api/users/exam', {
          withCredentials: true,
        });
        setExams(examsResponse.data);

        // Fetch results based on user role
        if (userInfo?.role === 'teacher') {
          // For teachers, fetch all results
          const resultsResponse = await axiosInstance.get('/api/users/results/all', {
            withCredentials: true,
          });
          setResults(resultsResponse.data.data);
        } else {
          // For students, fetch only their visible results
          const resultsResponse = await axiosInstance.get('/api/users/results/user', {
            withCredentials: true,
          });
          setResults(resultsResponse.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userInfo]);

  const handleToggleVisibility = async (resultId) => {
    try {
      await axiosInstance.put(
        `/api/users/results/${resultId}/toggle-visibility`,
        {},
        {
          withCredentials: true,
        },
      );
      toast.success('Visibility updated successfully');
      // Refresh results
      const response = await axiosInstance.get('/api/users/results/all', {
        withCredentials: true,
      });
      setResults(response.data.data);
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  const handleViewCode = (result) => {
    setSelectedResult(result);
    setCodeDialogOpen(true);
  };

  const handleExamChange = async (examId) => {
    setSelectedExam(examId);
    
    if (examId === 'all') {
      // Fetch all results
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/users/results/all', {
          withCredentials: true,
        });
        setResults(response.data.data);
      } catch (err) {
        toast.error('Failed to fetch all results');
      } finally {
        setLoading(false);
      }
    } else {
      // Fetch results for specific exam
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/users/results/exam/${examId}`, {
          withCredentials: true,
        });
        setResults(response.data.data);
      } catch (err) {
        toast.error('Failed to fetch exam results');
      } finally {
        setLoading(false);
      }
    }
  };

  const downloadCSV = () => {
    const headers = ['Student Name', 'Email', 'Exam', 'Total Score (%)', 'Total Marks', 'Coding Submissions', 'Submission Date'];
    const csvData = filteredResults.map(result => [
      result.userId?.name || '',
      result.userId?.email || '',
      exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || result.examId,
      result.percentage.toFixed(1),
      result.totalMarks,
      result.codingSubmissions?.length || 0,
      new Date(result.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `exam_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV downloaded successfully');
  };

  const downloadPDF = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    const examName = selectedExam === 'all' ? 'All Exams' : exams.find((e) => e._id === selectedExam || e.examId === selectedExam)?.examName || 'Exam';
    
    printWindow.document.write('<html><head><title>Exam Results</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
    printWindow.document.write('h1 { color: #333; text-align: center; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }');
    printWindow.document.write('th { background-color: #4CAF50; color: white; }');
    printWindow.document.write('tr:nth-child(even) { background-color: #f2f2f2; }');
    printWindow.document.write('.summary { display: flex; justify-content: space-around; margin: 20px 0; }');
    printWindow.document.write('.summary-card { text-align: center; padding: 15px; background: #f5f5f5; border-radius: 8px; }');
    printWindow.document.write('.summary-card h3 { margin: 0; color: #666; font-size: 14px; }');
    printWindow.document.write('.summary-card p { margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #333; }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(`<h1>Exam Results - ${examName}</h1>`);
    printWindow.document.write('<div class="summary">');
    printWindow.document.write(`<div class="summary-card"><h3>Total Students</h3><p>${filteredResults.length}</p></div>`);
    printWindow.document.write(`<div class="summary-card"><h3>Average Score</h3><p>${filteredResults.length > 0 ? (filteredResults.reduce((acc, curr) => acc + curr.percentage, 0) / filteredResults.length).toFixed(1) : 0}%</p></div>`);
    printWindow.document.write(`<div class="summary-card"><h3>Total Submissions</h3><p>${filteredResults.reduce((acc, curr) => acc + (curr.codingSubmissions?.length || 0), 0)}</p></div>`);
    printWindow.document.write('</div>');
    printWindow.document.write('<table>');
    printWindow.document.write('<thead><tr><th>Student Name</th><th>Email</th><th>Exam</th><th>Score (%)</th><th>Total Marks</th><th>Coding Submissions</th><th>Date</th></tr></thead>');
    printWindow.document.write('<tbody>');
    
    filteredResults.forEach(result => {
      printWindow.document.write('<tr>');
      printWindow.document.write(`<td>${result.userId?.name || ''}</td>`);
      printWindow.document.write(`<td>${result.userId?.email || ''}</td>`);
      printWindow.document.write(`<td>${exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || result.examId}</td>`);
      printWindow.document.write(`<td>${result.percentage.toFixed(1)}%</td>`);
      printWindow.document.write(`<td>${result.totalMarks}</td>`);
      printWindow.document.write(`<td>${result.codingSubmissions?.length || 0}</td>`);
      printWindow.document.write(`<td>${new Date(result.createdAt).toLocaleDateString()}</td>`);
      printWindow.document.write('</tr>');
    });
    
    printWindow.document.write('</tbody></table>');
    printWindow.document.write(`<p style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">Generated on ${new Date().toLocaleString()}</p>`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      toast.success('PDF generation initiated');
    }, 250);
  };

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab selection
    let matchesTab = true;
    if (selectedTab === 1) {
      // MCQ Results - show only results without coding submissions or with empty coding submissions
      matchesTab = !result.codingSubmissions || result.codingSubmissions.length === 0;
    }
    
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Student View
  if (userInfo?.role === 'student') {
    return (
      <PageContainer title="My Exam Results" description="View your exam results">
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Exams Taken
                </Typography>
                <Typography variant="h3">{results.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average Score
                </Typography>
                <Typography variant="h3">
                  {results.length > 0
                    ? `${(
                        results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length
                      ).toFixed(1)}%`
                    : '0%'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Submissions
                </Typography>
                <Typography variant="h3">
                  {results.reduce((acc, curr) => acc + (curr.codingSubmissions?.length || 0), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Results Table */}
          <Grid item xs={12}>
            <DashboardCard title="My Results">
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Exam Name</TableCell>
                      <TableCell>Total Score</TableCell>
                      <TableCell>Subjective Score</TableCell>
                      <TableCell>Coding Submissions</TableCell>
                      <TableCell>Total Score</TableCell>
                      <TableCell>Submission Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result._id}>
                        <TableCell>
  {exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || 'Exam'}
</TableCell>
                        <TableCell>
                          <Chip
                            label={`${result.percentage.toFixed(1)}%`}
                            color={result.percentage >= 70 ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          {result.subjectiveResponses?.length > 0 ? (
                            <Chip
                              label={`${result.subjectiveResponses.reduce((sum, sr) => sum + sr.aiScore, 0)}/${result.subjectiveResponses.reduce((sum, sr) => sum + sr.maxMarks, 0)}`}
                              color="info"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {result.codingSubmissions?.length > 0 && (
                              <CheckCircle color="success" fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            Total: {result.totalMarks}
                          </Typography>
                        </TableCell>
                        <TableCell>{new Date(result.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {(result.codingSubmissions?.length > 0 || result.subjectiveResponses?.length > 0) && (
                            <IconButton onClick={() => handleViewCode(result)}>
                              <Code />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DashboardCard>
          </Grid>
        </Grid>

        {/* Code View Dialog */}
        <Dialog
          open={codeDialogOpen}
          onClose={() => setCodeDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>My Submissions</DialogTitle>
          <DialogContent>
            {selectedResult?.subjectiveResponses?.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  AI-Graded Subjective Answers
                </Typography>
                {selectedResult.subjectiveResponses.map((response, index) => (
                  <Box key={index} mb={3} p={2} sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Question {index + 1}: {response.question}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Your Answer:
                    </Typography>
                    <Typography variant="body2" mb={2}>
                      {response.studentAnswer}
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip
                        label={`Score: ${response.aiScore}/${response.maxMarks}`}
                        color={response.aiScore >= response.maxMarks * 0.7 ? 'success' : 'warning'}
                      />
                      <Typography variant="body2" color="textSecondary">
                        Feedback: {response.aiFeedback}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </>
            )}
            {selectedResult?.codingSubmissions?.map((submission, index) => (
              <Box key={index} mb={3}>
                <Typography variant="h6" gutterBottom>
                  Coding Question {index + 1}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Language: {submission.language}
                </Typography>
                <SyntaxHighlighter language={submission.language} style={docco}>
                  {submission.code}
                </SyntaxHighlighter>
                <Box mt={1}>
                  <Chip icon={<CheckCircle />} label="Success" color="success" />
                  {submission.executionTime && (
                    <Chip label={`Execution Time: ${submission.executionTime}ms`} sx={{ ml: 1 }} />
                  )}
                </Box>
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCodeDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    );
  }

  // Teacher View
  return (
    <PageContainer title="Results Dashboard" description="View and manage exam results">
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Students
              </Typography>
              <Typography variant="h3">{filteredResults.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Score
              </Typography>
              <Typography variant="h3">
                {filteredResults.length > 0
                  ? `${(
                      filteredResults.reduce((acc, curr) => acc + curr.percentage, 0) /
                      filteredResults.length
                    ).toFixed(1)}%`
                  : '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Submissions
              </Typography>
              <Typography variant="h3">
                {filteredResults.reduce(
                  (acc, curr) => acc + (curr.codingSubmissions?.length || 0),
                  0,
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Table */}
        <Grid item xs={12}>
          <DashboardCard title="Exam Results">
            {/* Exam Filter and Search */}
            <Box mb={3} display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Select Exam</InputLabel>
                <Select
                  value={selectedExam}
                  onChange={(e) => handleExamChange(e.target.value)}
                  label="Select Exam"
                >
                  <MenuItem value="all">All Exams</MenuItem>
                  {exams.map((exam) => (
                    <MenuItem key={exam.examId} value={exam.examId}>
                      {exam.examName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Search Students"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ marginLeft: 'auto', display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={downloadCSV}
                  disabled={filteredResults.length === 0}
                >
                  Download CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdf />}
                  onClick={downloadPDF}
                  disabled={filteredResults.length === 0}
                  color="error"
                >
                  Download PDF
                </Button>
              </Box>
            </Box>

            <Tabs
              value={selectedTab}
              onChange={(e, newValue) => setSelectedTab(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab label="All Results" />
              <Tab label="MCQ Results" />
            </Tabs>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Exam</TableCell>
                    <TableCell>Total Score</TableCell>
                    <TableCell>Coding Submissions</TableCell>
                    <TableCell>Total Score</TableCell>
                    <TableCell>Submission Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result._id}>
                      <TableCell>{result.userId?.name}</TableCell>
                      <TableCell>{result.userId?.email}</TableCell>
                      <TableCell>
                        {exams.find((e) => e._id === result.examId || e.examId === result.examId)?.examName || result.examId}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${result.percentage.toFixed(1)}%`}
                          color={result.percentage >= 70 ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CheckCircle color="success" fontSize="small" />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          Total: {result.totalMarks}
                        </Typography>
                      </TableCell>
                      <TableCell>{new Date(result.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleToggleVisibility(result._id)}
                          color={result.showToStudent ? 'success' : 'default'}
                        >
                          {result.showToStudent ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Code View Dialog */}
      <Dialog
        open={codeDialogOpen}
        onClose={() => setCodeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Student Code Submissions</DialogTitle>
        <DialogContent>
          {selectedResult?.codingSubmissions?.map((submission, index) => (
            <Box key={index} mb={3}>
              <Typography variant="h6" gutterBottom>
                Question {index + 1}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Language: {submission.language}
              </Typography>
              <SyntaxHighlighter language={submission.language} style={docco}>
                {submission.code}
              </SyntaxHighlighter>
              <Box mt={1}>
                <Chip icon={<CheckCircle />} label="Success" color="success" />
                {submission.executionTime && (
                  <Chip label={`Execution Time: ${submission.executionTime}ms`} sx={{ ml: 1 }} />
                )}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodeDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ResultPage;
