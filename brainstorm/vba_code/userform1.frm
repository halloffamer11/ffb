VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} UserForm1 
   Caption         =   "Undo Pick"
   ClientHeight    =   2535
   ClientLeft      =   40
   ClientTop       =   400
   ClientWidth     =   4720
   OleObjectBlob   =   "userform1.frx":0000
   StartUpPosition =   1  'CenterOwner
End
Attribute VB_Name = "UserForm1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub UndoPick_Click()
Dim CustomPickNum As Integer
Dim LastPickNum As Integer
Dim PickLoc As Range

On Error GoTo ErrCall

LastPickNum = Sheets("Overall").Range("J3").Value - 1

If LastPickButt.Value = True Then
Set PickLoc = Cells(Application.Match(LastPickNum, Sheets("Overall").Range("J12:J640"), 0) + 11, 10)

PickLoc.ClearContents

Else
CustomPickNum = CustPickText.Value
Set PickLoc = Cells(Application.Match(CustomPickNum, Sheets("Overall").Range("J12:J640"), 0) + 11, 10)
PickLoc.ClearContents
End If

If PickLoc.EntireRow.Hidden = True Then
PickLoc.EntireRow.Hidden = False
End If

Unload Me
 Exit Sub

 
ErrCall:
MsgBox ("Error: Please make sure the pick you entered is valid"), , "Error"


End Sub
