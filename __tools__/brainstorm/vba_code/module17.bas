Attribute VB_Name = "Module17"
Sub DraftedHide()
With Application
    .ScreenUpdating = False
    .EnableEvents = False
    .Calculation = xlCalculationManual
    .DisplayAlerts = False
End With

ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=5, Criteria1:= _
        "No"
        
With Application
    .ScreenUpdating = True
    .EnableEvents = True
    .Calculation = xlCalculationAutomatic
    .DisplayAlerts = True
End With
End Sub

Sub DraftedShow()
'
' DraftedShow Macro

With Application
    .ScreenUpdating = False
    .EnableEvents = False
    .Calculation = xlCalculationManual
    .DisplayAlerts = False
End With


 ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=5

With Application
    .ScreenUpdating = True
    .EnableEvents = True
    .Calculation = xlCalculationAutomatic
    .DisplayAlerts = True
End With
    
End Sub
Sub ClearDrafted()
'
' ClearDrafted Macro
With Application
    .ScreenUpdating = False
    .EnableEvents = False
    .Calculation = xlCalculationManual
    .DisplayAlerts = False
End With


ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=5
    
Sheets("Overall").Select
    Range("Table1[Pick Num]").Select
    Selection.ClearContents
     Range("Table1[Trgt Pick]").Select
    Selection.ClearContents
    Sheets("Pick Trades").Select
    Range("Table2[New Owner]").Select
    Selection.ClearContents
Sheets("Overall").Select

With Application
    .ScreenUpdating = True
    .EnableEvents = True
    .Calculation = xlCalculationAutomatic
    .DisplayAlerts = True
End With

End Sub

