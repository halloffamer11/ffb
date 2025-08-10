Attribute VB_Name = "Module20"
Sub PosDrop()

With Application
    .ScreenUpdating = False
    .EnableEvents = False
    .Calculation = xlCalculationManual
    .DisplayAlerts = False
End With

Dim ws As Worksheet
Dim dd As DropDown
Dim Pos As String

Set ws = ActiveSheet
Set dd = ActiveSheet.Shapes(Application.Caller).OLEFormat.Object

 Pos = dd.List(dd.Value)

If Pos = "Show All Positions" Then
ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=7

ElseIf Pos = "WR/TE" Then
ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=7, _
Criteria1:="=WR", Operator:=xlOr, Criteria2:="=TE"

ElseIf Pos = "WR/RB" Then
ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=7, _
Criteria1:="=WR", Operator:=xlOr, Criteria2:="=RB"

ElseIf Pos = "WR/RB/TE" Then
ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=7, _
Criteria1:=Array("WR", "RB", "TE"), _
                    Operator:=xlFilterValues

ElseIf Pos = "WR/RB/TE/QB" Then
ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=7, _
Criteria1:=Array("WR", "RB", "TE", "QB"), _
                    Operator:=xlFilterValues

ElseIf Pos = "IDP" Then
ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=7, _
Criteria1:=Array("DB", "LB", "DL"), _
                    Operator:=xlFilterValues

Else
ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=7, _
Criteria1:="=" & Pos, Operator:=xlAnd
End If

With Application
    .ScreenUpdating = True
    .EnableEvents = True
    .Calculation = xlCalculationAutomatic
    .DisplayAlerts = True
End With

End Sub

Sub TeamDrop()

With Application
    .ScreenUpdating = False
    .EnableEvents = False
    .Calculation = xlCalculationManual
    .DisplayAlerts = False
End With

Dim ws As Worksheet
Dim dd As DropDown
Dim Team As String

Set ws = ActiveSheet
Set dd = ActiveSheet.Shapes(Application.Caller).OLEFormat.Object

 Team = dd.List(dd.Value)

If Team = "Show All Teams" Then
ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=8

Else
ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=8, _
Criteria1:="=" & Team, Operator:=xlAnd

End If

With Application
    .ScreenUpdating = True
    .EnableEvents = True
    .Calculation = xlCalculationAutomatic
    .DisplayAlerts = True
End With

End Sub


