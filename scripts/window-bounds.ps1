Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
}
"@

while ($true) {
    try {
        $hwnd = [Win32]::GetForegroundWindow()
        if ($hwnd -ne [IntPtr]::Zero) {
            $rect = New-Object Win32+RECT
            if ([Win32]::GetWindowRect($hwnd, [ref]$rect)) {
                # Format output as Left,Top,Right,Bottom
                Write-Host "$($rect.Left),$($rect.Top),$($rect.Right),$($rect.Bottom)"
            }
        }
    } catch {
        # Silent fail on any parsing logic issues
    }
    Start-Sleep -Milliseconds 100
}
