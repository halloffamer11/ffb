Attribute VB_Name = "Module14"

Sub UnhideAllSheets()
Dim ws As Worksheet
For Each ws In ActiveWorkbook.Worksheets
ws.Visible = xlSheetVisible
Next ws
End Sub
Sub RefreshAll()

With Application
    .ScreenUpdating = False
    .EnableEvents = False
    .Calculation = xlCalculationManual
    .DisplayAlerts = False
End With

Dim wks As Worksheet
Dim qt As QueryTable


On Error Resume Next

For Each wks In ActiveWorkbook.Worksheets
For Each qt In wks.QueryTables

qt.Refresh BackgroundQuery:=False
Next qt
Next wks



ThisWorkbook.RefreshAll


With Application
    .EnableEvents = True
    .Calculation = xlCalculationAutomatic
    .ScreenUpdating = True
    .DisplayAlerts = True
End With

MsgBox "All data is being updated"

End Sub

