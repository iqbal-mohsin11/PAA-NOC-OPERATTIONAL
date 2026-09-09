using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace PAASentinel
{
    static class Program
    {
        private static NotifyIcon trayIcon;
        private static ContextMenuStrip trayMenu;
        private static Process serverProcess;
        private static string appDir;
        private const int ServerPort = 3000;
        private const string LocalUrl = "http://localhost:3000";

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            appDir = AppDomain.CurrentDomain.BaseDirectory;

            // Single instance check via Windows Named Mutex
            bool isFirstInstance;
            using (Mutex mutex = new Mutex(true, "PAA_Sentinel_SingleInstance_App_Mutex", out isFirstInstance))
            {
                if (!isFirstInstance)
                {
                    // If already running, simply focus and open the web dashboard
                    OpenBrowser(LocalUrl);
                    return;
                }

                // Initialize System Tray Context Menu
                trayMenu = new ContextMenuStrip();
                ToolStripMenuItem titleItem = new ToolStripMenuItem("PAA Sentinel v5.0 (JIAP / HQCAA)");
                titleItem.Enabled = false;
                titleItem.Font = new Font(titleItem.Font, FontStyle.Bold);
                trayMenu.Items.Add(titleItem);
                trayMenu.Items.Add(new ToolStripSeparator());

                ToolStripMenuItem openItem = new ToolStripMenuItem("🌐 Open Dashboard (localhost:3000)", null, (s, e) => OpenBrowser(LocalUrl));
                openItem.Font = new Font(openItem.Font, FontStyle.Bold);
                trayMenu.Items.Add(openItem);

                trayMenu.Items.Add(new ToolStripMenuItem("📡 View LAN / Network IP", null, (s, e) => ShowLanDetails()));
                trayMenu.Items.Add(new ToolStripMenuItem("🔄 Restart Background Server", null, (s, e) => RestartBackgroundServer()));
                trayMenu.Items.Add(new ToolStripSeparator());
                trayMenu.Items.Add(new ToolStripMenuItem("🛑 Exit PAA Sentinel", null, (s, e) => ExitApplication()));

                // Initialize System Tray Icon
                trayIcon = new NotifyIcon();
                trayIcon.Text = "PAA Sentinel IT Asset Hub (Port 3000)";
                trayIcon.Icon = SystemIcons.Shield;
                trayIcon.ContextMenuStrip = trayMenu;
                trayIcon.Visible = true;
                trayIcon.DoubleClick += (s, e) => OpenBrowser(LocalUrl);

                // Start Server in background if port 3000 is not already running
                StartServerIfNotRunning();

                // Open browser on launch
                OpenBrowser(LocalUrl);

                // Show notification balloon
                try
                {
                    trayIcon.ShowBalloonTip(
                        3000,
                        "PAA Sentinel Server Active",
                        "The Asset Hub is running on http://localhost:3000\nRight-click tray icon to manage.",
                        ToolTipIcon.Info
                    );
                }
                catch { }

                Application.Run();
            }
        }

        private static bool IsPortInUse(int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    IAsyncResult result = client.BeginConnect("127.0.0.1", port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(800);
                    if (success && client.Connected)
                    {
                        client.EndConnect(result);
                        return true;
                    }
                }
            }
            catch { }
            return false;
        }

        private static void StartServerIfNotRunning()
        {
            if (IsPortInUse(ServerPort))
            {
                return; // Server is already active
            }

            try
            {
                string serverScript = Path.Combine(appDir, "dist", "server.cjs");
                string runBat = Path.Combine(appDir, "Install_and_Run_PAA_Server.bat");
                string autoBat = Path.Combine(appDir, "INSTALL_ON_PC.bat");

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.WorkingDirectory = appDir;
                psi.CreateNoWindow = true;
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                psi.UseShellExecute = false;

                if (File.Exists(serverScript) && HasNodeInstalled())
                {
                    psi.FileName = "node";
                    psi.Arguments = "\"" + serverScript + "\"";
                }
                else if (File.Exists(autoBat))
                {
                    psi.FileName = "cmd.exe";
                    psi.Arguments = "/c \"" + autoBat + "\"";
                }
                else if (File.Exists(runBat))
                {
                    psi.FileName = "cmd.exe";
                    psi.Arguments = "/c \"" + runBat + "\"";
                }
                else
                {
                    psi.FileName = "cmd.exe";
                    psi.Arguments = "/c npm run dev";
                }

                serverProcess = Process.Start(psi);

                // Poll for up to 10 seconds until port is open
                for (int i = 0; i < 20; i++)
                {
                    Thread.Sleep(500);
                    if (IsPortInUse(ServerPort)) break;
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Unable to start local server automatically:\n" + ex.Message, "PAA Sentinel", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private static bool HasNodeInstalled()
        {
            try
            {
                ProcessStartInfo check = new ProcessStartInfo("where", "node");
                check.CreateNoWindow = true;
                check.UseShellExecute = false;
                check.RedirectStandardOutput = true;
                using (Process p = Process.Start(check))
                {
                    p.WaitForExit(1000);
                    return p.ExitCode == 0;
                }
            }
            catch
            {
                return false;
            }
        }

        private static void OpenBrowser(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch
            {
                try
                {
                    Process.Start("cmd", "/c start " + url);
                }
                catch { }
            }
        }

        private static void ShowLanDetails()
        {
            string hostName = Dns.GetHostName();
            IPHostEntry host = Dns.GetHostEntry(hostName);
            string ipList = "";

            foreach (IPAddress ip in host.AddressList)
            {
                if (ip.AddressFamily == AddressFamily.InterNetwork)
                {
                    ipList += "• http://" + ip.ToString() + ":" + ServerPort + "\n";
                }
            }

            if (string.IsNullOrEmpty(ipList))
            {
                ipList = "• http://" + hostName + ":" + ServerPort + "\n";
            }

            MessageBox.Show(
                "Colleagues and other PCs on your office Wi-Fi / LAN can access PAA Sentinel at:\n\n" +
                ipList + "\n" +
                "Make sure port " + ServerPort + " is open in Windows Firewall (run INSTALL_ON_PC.bat).",
                "PAA Sentinel - LAN Network Access",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information
            );
        }

        private static void RestartBackgroundServer()
        {
            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    serverProcess.Kill();
                }
            }
            catch { }

            StartServerIfNotRunning();

            if (trayIcon != null)
            {
                trayIcon.ShowBalloonTip(2000, "Server Restarted", "PAA Sentinel is ready on " + LocalUrl, ToolTipIcon.Info);
            }
        }

        private static void ExitApplication()
        {
            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    serverProcess.Kill();
                }
            }
            catch { }

            if (trayIcon != null)
            {
                trayIcon.Visible = false;
                trayIcon.Dispose();
            }

            Application.Exit();
        }
    }
}
