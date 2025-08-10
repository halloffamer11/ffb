Attribute VB_Name = "Module8"
Sub ShowRBWR()
Attribute ShowRBWR.VB_ProcData.VB_Invoke_Func = " \n14"
'
' ShowRBWR Macro
'

'
    ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=14, Criteria1:= _
        "=RB", Operator:=xlOr, Criteria2:="=WR"
End Sub
