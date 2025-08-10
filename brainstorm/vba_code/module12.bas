Attribute VB_Name = "Module12"
Sub ShowFlex()
Attribute ShowFlex.VB_ProcData.VB_Invoke_Func = " \n14"
'
' ShowFlex Macro
'

'
    ActiveSheet.ListObjects("Table1").Range.AutoFilter Field:=14, Criteria1:= _
        Array("RB", "TE", "WR"), Operator:=xlFilterValues
End Sub
