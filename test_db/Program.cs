using System;
using MySql.Data.MySqlClient;

class Program
{
    static void Main()
    {
        string[] passwordsToTry = new string[]
        {
            "MYsql@&#3129;", // Literal with HTML entity format (including semicolon)
            "MYsql@&#3129",  // Literal HTML entity format (no semicolon)
            "MYsql@హ",      // Decoded Telugu character
            "MYsql@&3129",   // Ampersand format
            "CJS@12345",     // Previous PostgreSQL password
            "",              // Blank password
            "root",          // Default root
            "admin",
            "1234",
            "123456",
            "12345678"
        };

        Console.WriteLine("=== MySQL Password Diagnostic Test ===");

        foreach (string pwd in passwordsToTry)
        {
            string connString = $"Server=localhost;Port=3306;Database=tutorly;Uid=root;Pwd={pwd};AllowUserVariables=True;UseAffectedRows=True";
            
            try
            {
                using (var conn = new MySqlConnection(connString))
                {
                    conn.Open();
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine($"[SUCCESS] Connected successfully using password: \"{pwd}\"");
                    Console.ResetColor();
                    return; // Stop on first success
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[FAILED] Password: \"{pwd}\" - Error: {ex.Message}");
                Console.ResetColor();
            }
        }

        Console.WriteLine("\n[ERROR] None of the test passwords worked. Please verify your MySQL credentials in Workbench.");
    }
}
