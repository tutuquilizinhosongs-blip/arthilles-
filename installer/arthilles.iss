#define MyAppName "Arthilles"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Arthilles"
#define MyAppURL "https://github.com/tutuquilizinhosongs-blip/arthilles-"

[Setup]
AppId={{9CF0796A-B65E-472E-8F53-1B85C8D5E0E0}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName=C:\Arthilles
DisableDirPage=yes
DefaultGroupName=Arthilles
DisableProgramGroupPage=yes
OutputDir=..\dist
OutputBaseFilename=ArthillesSetup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
UninstallDisplayIcon={app}\dashboard\public\icon.svg

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Files]
Source: "..\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion; Excludes: ".git\*,dist\*,backups\*,data\*,node_modules\*,.next\*,*.log,.env"

[Dirs]
Name: "{app}\data"
Name: "{app}\data\postgres"
Name: "{app}\data\redis"
Name: "{app}\data\ollama"
Name: "{app}\data\n8n"

[Icons]
Name: "{autodesktop}\Arthilles Painel"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\windows\open-panel.ps1"""; WorkingDir: "{app}"
Name: "{autodesktop}\Iniciar Arthilles"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\windows\start-installed.ps1"""; WorkingDir: "{app}"
Name: "{autodesktop}\Parar Arthilles"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\windows\stop-installed.ps1"""; WorkingDir: "{app}"
Name: "{autodesktop}\Logs Arthilles"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\windows\logs-installed.ps1"""; WorkingDir: "{app}"
Name: "{group}\Arthilles Painel"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\windows\open-panel.ps1"""; WorkingDir: "{app}"
Name: "{group}\Iniciar Arthilles"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\windows\start-installed.ps1"""; WorkingDir: "{app}"
Name: "{group}\Parar Arthilles"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\windows\stop-installed.ps1"""; WorkingDir: "{app}"
Name: "{group}\Logs Arthilles"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\windows\logs-installed.ps1"""; WorkingDir: "{app}"

[Run]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\windows\start-installed.ps1"""; WorkingDir: "{app}"; Description: "Iniciar Arthilles agora"; Flags: postinstall nowait skipifsilent

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\windows\uninstall-clean.ps1"""; WorkingDir: "{app}"; RunOnceId: "StopArthilles"

[Code]
function DockerInstalled(): Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('cmd.exe', '/C docker --version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

function InitializeSetup(): Boolean;
var
  ErrorCode: Integer;
begin
  Result := True;
  if not DockerInstalled() then
  begin
    MsgBox('Docker Desktop nao foi encontrado. O Arthilles precisa do Docker Desktop instalado para funcionar. Clique em OK para abrir o site oficial do Docker.', mbInformation, MB_OK);
    ShellExec('open', 'https://www.docker.com/products/docker-desktop/', '', '', SW_SHOWNORMAL, ewNoWait, ErrorCode);
    Result := False;
  end;
end;
