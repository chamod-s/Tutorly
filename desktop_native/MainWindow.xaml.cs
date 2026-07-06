using System;
using System.Data;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using MySql.Data.MySqlClient;
using TutorlyDesktop.Database;

namespace TutorlyDesktop
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            CheckDatabaseConnection();
        }

        private void CheckDatabaseConnection()
        {
            if (DatabaseHelper.TestConnection(out string error))
            {
                DbStatusText.Text = "● Connected to local database (MySQL)";
                DbStatusText.Foreground = new SolidColorBrush(Color.FromRgb(34, 197, 94)); // Emerald Green
            }
            else
            {
                DbStatusText.Text = "✕ Database connection failed. Verify MySQL is running.";
                DbStatusText.Foreground = new SolidColorBrush(Color.FromRgb(239, 68, 68)); // Red
                Console.WriteLine($"DB Connection error: {error}");
            }
        }

        private void SignInButton_Click(object sender, RoutedEventArgs e)
        {
            ErrorBorder.Visibility = Visibility.Collapsed;
            string email = EmailInput.Text.Trim();
            string password = PasswordInput.Password;

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                ShowError("Please fill in all fields.");
                return;
            }

            try
            {
                using (var conn = DatabaseHelper.GetConnection())
                {
                    conn.Open();
                    string query = "SELECT id, email, passwordHash, role, firstName, lastName FROM users WHERE email = @email LIMIT 1";
                    
                    using (var cmd = new MySqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@email", email);
                        
                        using (var reader = cmd.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                string userId = reader.GetString("id");
                                string storedHash = reader.GetString("passwordHash");
                                string role = reader.GetString("role");
                                string name = $"{reader.GetString("firstName")} {reader.GetString("lastName")}";

                                // Verify hashed password using BCrypt
                                bool isVerified = BCrypt.Net.BCrypt.Verify(password, storedHash);

                                if (isVerified)
                                {
                                    MessageBox.Show($"Welcome, {name}!\nYou have logged in successfully as an {role}.", 
                                                    "Login Success", MessageBoxButton.OK, MessageBoxImage.Information);
                                    
                                    // Transition to dashboard depending on role
                                    OpenDashboard(userId, role, name);
                                    this.Close();
                                }
                                else
                                {
                                    ShowError("Invalid email or password.");
                                }
                            }
                            else
                            {
                                ShowError("Invalid email or password.");
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                ShowError("An error occurred while connecting to the database.");
                MessageBox.Show($"Detailed Error: {ex.Message}", "Database Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void OpenDashboard(string userId, string role, string userName)
        {
            Application.Current.ShutdownMode = ShutdownMode.OnLastWindowClose;
            var dashboard = new DashboardWindow(userId, role, userName);
            Application.Current.MainWindow = dashboard;
            dashboard.Show();
        }

        private void ShowError(string message)
        {
            ErrorText.Text = message;
            ErrorBorder.Visibility = Visibility.Visible;
        }

        // Input Focus Highlight styling
        private void Input_GotFocus(object sender, RoutedEventArgs e)
        {
            if (sender is TextBox tb)
            {
                tb.BorderBrush = new SolidColorBrush(Color.FromRgb(37, 99, 235)); // Primary 600 Blue
                tb.Background = Brushes.White;
            }
            else if (sender is PasswordBox pb)
            {
                pb.BorderBrush = new SolidColorBrush(Color.FromRgb(37, 99, 235));
                pb.Background = Brushes.White;
            }
        }

        private void Input_LostFocus(object sender, RoutedEventArgs e)
        {
            var slateColor = new SolidColorBrush(Color.FromRgb(203, 213, 225)); // Slate 300
            var greyBg = new SolidColorBrush(Color.FromRgb(248, 250, 252)); // Slate 50
            if (sender is TextBox tb)
            {
                tb.BorderBrush = slateColor;
                tb.Background = greyBg;
            }
            else if (sender is PasswordBox pb)
            {
                pb.BorderBrush = slateColor;
                pb.Background = greyBg;
            }
        }
    }
}