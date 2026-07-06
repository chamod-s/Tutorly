using System;
using System.Collections.Generic;
using System.Data;
using System.Windows;
using MySql.Data.MySqlClient;
using TutorlyDesktop.Database;

namespace TutorlyDesktop
{
    public partial class DashboardWindow : Window
    {
        private readonly string _userId;
        private readonly string _role;
        private readonly string _userName;

        public DashboardWindow(string userId, string role, string userName)
        {
            InitializeComponent();
            _userId = userId;
            _role = role;
            _userName = userName;

            SetupUserInfo();
            LoadDashboardData();
        }

        private void SetupUserInfo()
        {
            UserNameText.Text = _userName;
            UserRoleText.Text = _role;
            WelcomeHeadingText.Text = $"Welcome back, {_userName}!";
            
            if (!string.IsNullOrEmpty(_userName))
            {
                UserInitials.Text = _userName[0].ToString().ToUpper();
            }

            // Customize view settings depending on role
            if (_role == "STUDENT")
            {
                Stat1Title.Text = "Enrolled Courses";
                Stat2Title.Text = "Completed Lessons";
                Stat3Title.Text = "Unread Notifications";
                GridTitleText.Text = "My Registered Courses";
                SubheadingText.Text = "Start learning from your enrolled courses today.";
            }
            else if (_role == "TEACHER")
            {
                Stat1Title.Text = "My Active Courses";
                Stat2Title.Text = "Total Students Enrolled";
                Stat3Title.Text = "Total Course Earnings";
                GridTitleText.Text = "Courses I Teach";
                SubheadingText.Text = "Manage your courses, view students, and review earnings.";
            }
            else if (_role == "ADMIN")
            {
                Stat1Title.Text = "Total Platform Users";
                Stat2Title.Text = "Total Courses Published";
                Stat3Title.Text = "Pending Teacher Approvals";
                GridTitleText.Text = "All Published Courses";
                SubheadingText.Text = "System Administrator overview and statistics.";
            }
        }

        private void LoadDashboardData()
        {
            try
            {
                using (var conn = DatabaseHelper.GetConnection())
                {
                    conn.Open();
                    LoadStats(conn);
                    LoadCoursesGrid(conn);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error loading dashboard data: {ex.Message}", "Database Load Error", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        private void LoadStats(MySqlConnection conn)
        {
            if (_role == "STUDENT")
            {
                // Enrolled courses count
                string q1 = "SELECT COUNT(*) FROM enrollments WHERE studentId = @studentId";
                using (var cmd = new MySqlCommand(q1, conn))
                {
                    cmd.Parameters.AddWithValue("@studentId", _userId);
                    Stat1Val.Text = Convert.ToInt32(cmd.ExecuteScalar()).ToString();
                }

                // Hardcoded mock stats for secondary items
                Stat2Val.Text = "3 / 3";
                Stat3Val.Text = "1";
            }
            else if (_role == "TEACHER")
            {
                // Number of courses taught by the teacher
                string q1 = "SELECT COUNT(*) FROM courses c JOIN teacher_profiles t ON c.teacherId = t.id WHERE t.userId = @userId";
                using (var cmd = new MySqlCommand(q1, conn))
                {
                    cmd.Parameters.AddWithValue("@userId", _userId);
                    Stat1Val.Text = Convert.ToInt32(cmd.ExecuteScalar()).ToString();
                }

                // Total students enrolled under this teacher's courses
                string q2 = @"SELECT COUNT(e.id) FROM enrollments e 
                              JOIN courses c ON e.courseId = c.id 
                              JOIN teacher_profiles t ON c.teacherId = t.id 
                              WHERE t.userId = @userId";
                using (var cmd = new MySqlCommand(q2, conn))
                {
                    cmd.Parameters.AddWithValue("@userId", _userId);
                    Stat2Val.Text = Convert.ToInt32(cmd.ExecuteScalar()).ToString();
                }

                // Total earnings from teacher profile
                string q3 = "SELECT totalEarnings FROM teacher_profiles WHERE userId = @userId";
                using (var cmd = new MySqlCommand(q3, conn))
                {
                    cmd.Parameters.AddWithValue("@userId", _userId);
                    object val = cmd.ExecuteScalar();
                    double earnings = val != DBNull.Value ? Convert.ToDouble(val) : 0.0;
                    Stat3Val.Text = $"{earnings:N2} LKR";
                }
            }
            else if (_role == "ADMIN")
            {
                // Total users on platform
                string q1 = "SELECT COUNT(*) FROM users";
                using (var cmd = new MySqlCommand(q1, conn))
                {
                    Stat1Val.Text = Convert.ToInt32(cmd.ExecuteScalar()).ToString();
                }

                // Total courses
                string q2 = "SELECT COUNT(*) FROM courses";
                using (var cmd = new MySqlCommand(q2, conn))
                {
                    Stat2Val.Text = Convert.ToInt32(cmd.ExecuteScalar()).ToString();
                }

                // Pending teacher approvals
                string q3 = "SELECT COUNT(*) FROM teacher_profiles WHERE approvalStatus = 'PENDING'";
                using (var cmd = new MySqlCommand(q3, conn))
                {
                    Stat3Val.Text = Convert.ToInt32(cmd.ExecuteScalar()).ToString();
                }
            }
        }

        private void LoadCoursesGrid(MySqlConnection conn)
        {
            string query = "";
            if (_role == "STUDENT")
            {
                query = @"SELECT c.title, c.category, c.level, c.language, c.price 
                          FROM courses c 
                          JOIN enrollments e ON c.id = e.courseId 
                          WHERE e.studentId = @userId";
            }
            else if (_role == "TEACHER")
            {
                query = @"SELECT c.title, c.category, c.level, c.language, c.price 
                          FROM courses c 
                          JOIN teacher_profiles t ON c.teacherId = t.id 
                          WHERE t.userId = @userId";
            }
            else if (_role == "ADMIN")
            {
                query = "SELECT title, category, level, language, price FROM courses";
            }

            var coursesList = new List<CourseItem>();

            using (var cmd = new MySqlCommand(query, conn))
            {
                if (_role != "ADMIN")
                {
                    cmd.Parameters.AddWithValue("@userId", _userId);
                }

                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        coursesList.Add(new CourseItem
                        {
                            Title = reader.GetString("title"),
                            Category = reader.IsDBNull(reader.GetOrdinal("category")) ? "N/A" : reader.GetString("category"),
                            Level = reader.GetString("level"),
                            Language = reader.GetString("language"),
                            Price = reader.GetDouble("price")
                        });
                    }
                }
            }

            CoursesDataGrid.ItemsSource = coursesList;
        }

        private void LogoutButton_Click(object sender, RoutedEventArgs e)
        {
            var loginWin = new MainWindow();
            loginWin.Show();
            this.Close();
        }
    }

    public class CourseItem
    {
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public double Price { get; set; }
    }
}
