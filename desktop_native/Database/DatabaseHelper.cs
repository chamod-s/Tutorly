using System;
using System.Data;
using MySql.Data.MySqlClient;

namespace TutorlyDesktop.Database
{
    public static class DatabaseHelper
    {
        // Change credentials here as needed to match MySQL Workbench setup
        private static readonly string ConnectionString = "Server=localhost;Port=3306;Database=tutorly;Uid=root;Pwd=MYsql@&#3129;;AllowUserVariables=True;UseAffectedRows=True";

        public static MySqlConnection GetConnection()
        {
            return new MySqlConnection(ConnectionString);
        }

        public static bool TestConnection(out string errorMessage)
        {
            errorMessage = string.Empty;
            try
            {
                using (var conn = GetConnection())
                {
                    conn.Open();
                    return true;
                }
            }
            catch (Exception ex)
            {
                errorMessage = ex.Message;
                return false;
            }
        }
    }
}
