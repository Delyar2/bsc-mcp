import { type Hex } from "viem";
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { decryptPrivateKey, } from "./PrivateAES.js";
import { privateKeyToAccount } from "viem/accounts";
import { publicClient } from "./config.js";

const platform = os.platform();
export function buildTxUrl(txHash: Hex | undefined): string | undefined {
  if (!txHash) {
    return undefined;
  }
  const txUrl = `https://bscscan.com/tx/${txHash}`;
  return txUrl
}
export async function checkTransactionHash(txHash: Hex): Promise<string> {

  const txReceipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    retryCount: 300,
    retryDelay: 100,
  });
  const txUrl = `https://bscscan.com/tx/${txHash}`;
  if (txReceipt.status !== "success") {
    throw new Error(`Please check the transaction results on bscscan, ${txUrl}`);
  }
  return txUrl;
}

export function bigIntReplacer(key: string, value: any) {
  return typeof value === 'bigint' ? value.toString() : value;
}

export interface InputBoxOptions {
  title?: string;
  message?: string;
  defaultValue?: string;
  termsText?: string;
}

export interface InputResult {
  value: string | null;
  agreed: boolean;
}

let passwordLock = false

export async function getPassword(isRetry?: boolean, num = 0): Promise<InputResult> {
  if (passwordLock) {
    throw new Error("Password lock is enabled. Try again in 24 hours");
  }
  if (num > 10) {
    passwordLock = true;

    setTimeout(() => {
      passwordLock = false;
    }, 1000 * 60 * 60 * 24);
    throw new Error("You have entered the wrong password too many times.");
  }

  const passwordResp = await showInputBoxWithTerms(isRetry);
  if (!passwordResp.value) {
    throw new Error("You did not enter a password.");
  }
  if (passwordResp.value.length < 8 || passwordResp.value.length > 128) {
    throw new Error("The password must be between 8 and 128 characters.");
  }
  const password = passwordResp.value;

  const BSC_WALLET_PRIVATE_KEY = process.env.BSC_WALLET_PRIVATE_KEY as Hex
  if (!BSC_WALLET_PRIVATE_KEY) {
    throw new Error("BSC_WALLET_PRIVATE_KEY is not defined");
  }
  try {

    const pk = await decryptPrivateKey(BSC_WALLET_PRIVATE_KEY, password)
    const account = privateKeyToAccount(
      pk as Hex
    );
    const address = process.env.BSC_WALLET_ADDRESS
    if (!address) {
      throw new Error("BSC_WALLET_ADDRESS is not defined");
    }

    if (account.address != address) {
      return await getPassword(true, ++num);
    }

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Password lock is enabled. Try again in 24 hours") {
        throw error;
      }
      if (error.message === "You have entered the wrong password too many times.") {
        throw error;
      }
    }
    return await getPassword(true, ++num);
  }
  return passwordResp;
}

export function showInputBoxWithTerms(isRetry?: boolean): Promise<InputResult> {

  let message = "Enter your Wallet Password:";
  if (isRetry) {
    message = "Wrong password, please try again:";
  }
  return new Promise((resolve, reject) => {

    switch (platform) {
      case 'darwin':
        // For macOS, we use AppleScript to show a dialog with both input and checkbox
        // The AppleScript is more complex but allows for a better UX
        if (isRetry) {
          message = "❌" + message
        }
        const appleScript = `
        tell application "System Events"
        set userPassword to ""
        set buttonPressed to ""
        
        repeat
            try
                set userInput to display dialog "${message}" default answer "" with hidden answer buttons {"cancel", "confirm"} default button "confirm" with icon note
                set userPassword to text returned of userInput
                set buttonPressed to button returned of userInput
                
                if buttonPressed is "cancel" then
                    exit repeat
                end if
                
                if (length of userPassword >= 8) and (length of userPassword <= 128) then
                    exit repeat
                end if
                
                display dialog "Wallet Password must be between 8 and 128 characters!" buttons {"confirm"} default button "confirm" with icon caution
            on error
                -- Handle any errors (like when user clicks the red close button)
                exit repeat
            end try
        end repeat
        
        if buttonPressed is not "cancel" then
            set agreeToTerms to button returned of (display dialog "🔒 You will stay signed in for the next hour." buttons {"no", "yes"} default button "no" with icon caution)
            return userPassword & "============" & agreeToTerms
        else
            return "canceled"
        end if
    end tell
        `;

        exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
          if (error) {
            // User cancelled
            if (error.code === 1 || error.code === 255) {
              resolve({ value: null, agreed: false });
            } else {
              reject(error);
            }
            return;
          }

          if (stdout.trim() === "canceled") {
            reject(new Error("Please enter the password before using ❕"));
            return;
          }
          const [password, agree] = stdout.trim().split("============");
          resolve({
            value: password,
            agreed: agree === "yes"
          });
        });
        break;

      case 'win32':

        const winCommand = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        
        $form = New-Object System.Windows.Forms.Form
        $form.Text = 'wallet password'
        $form.Size = New-Object System.Drawing.Size(450,300)
        $form.StartPosition = 'CenterScreen'
        
        $label = New-Object System.Windows.Forms.Label
        $label.Location = New-Object System.Drawing.Point(10,20)
        $label.Size = New-Object System.Drawing.Size(380,40)
        $label.Text = '${message}'
        $form.Controls.Add($label)
        
        # User input label
        $userLabel = New-Object System.Windows.Forms.Label
        $userLabel.Location = New-Object System.Drawing.Point(10,70)
        $userLabel.Size = New-Object System.Drawing.Size(150,20)
        $userLabel.Text = 'Input Password:'
        $form.Controls.Add($userLabel)
        
        # User input textbox
        $passwordTextBox = New-Object System.Windows.Forms.TextBox
        $passwordTextBox.Location = New-Object System.Drawing.Point(160,70)
        $passwordTextBox.Size = New-Object System.Drawing.Size(250,20)
        $passwordTextBox.PasswordChar = '*' 
        $form.Controls.Add($passwordTextBox)
        
        # Error message label
        $errorLabel = New-Object System.Windows.Forms.Label
        $errorLabel.Location = New-Object System.Drawing.Point(160,95)
        $errorLabel.Size = New-Object System.Drawing.Size(250,20)
        $errorLabel.ForeColor = [System.Drawing.Color]::Red
        $errorLabel.Text = ''
        $form.Controls.Add($errorLabel)
        
        $checkbox = New-Object System.Windows.Forms.CheckBox
        $checkbox.Location = New-Object System.Drawing.Point(10,130)
        $checkbox.Size = New-Object System.Drawing.Size(350,20)
        $checkbox.Text = 'You will stay signed in for the next hour.'
        $form.Controls.Add($checkbox)
        
        $button = New-Object System.Windows.Forms.Button
        $button.Location = New-Object System.Drawing.Point(175,190)
        $button.Size = New-Object System.Drawing.Size(100,30)
        $button.Text = 'Confirm'
        $button.Add_Click({
            # Validate password length
            if ($passwordTextBox.Text.Length -lt 8 -or $passwordTextBox.Text.Length -gt 128) {
                $errorLabel.Text = 'Wallet Password must be between 8 and 128 characters!'
            } else {
                $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
                $form.Close()
            }
        })
        $form.Controls.Add($button)
        
        $form.AcceptButton = $button
        $form.Add_Shown({$form.Activate()})
        [void]$form.ShowDialog()
        
        if ($form.DialogResult -eq [System.Windows.Forms.DialogResult]::OK) {
            $result = @{
              agreed = $checkbox.Checked
              value = $passwordTextBox.Text
            }
        
            $jsonResult = ConvertTo-Json -InputObject $result
            Write-Output $jsonResult
        }
        exit 0
`

        const tempScriptPath = path.join('.', 'terms_form.ps1');
        fs.writeFileSync(tempScriptPath, winCommand);

        exec(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`, (error, stdout, stderr) => {
          fs.unlinkSync(tempScriptPath);

          if (error && error.code !== 1) {
            resolve({
              value: null,
              agreed: false
            });
            return;
          }
          if (!stdout) {
            reject(new Error("Please enter the password before using ❕"));
            return;
          }
          const stdoutJSON = JSON.parse(stdout);
          resolve({
            value: stdoutJSON.value as string,
            agreed: stdoutJSON.agreed as boolean
          });
        });
        break;

      default:
        reject(new Error(`Unsupported platform and command-line input is not available: ${platform}`));
    }
  });
}
