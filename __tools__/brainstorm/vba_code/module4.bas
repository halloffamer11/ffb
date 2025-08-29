Attribute VB_Name = "Module4"
Sub hidedrafted2()
Attribute hidedrafted2.VB_ProcData.VB_Invoke_Func = " \n14"
'
' hidedrafted2 Macro
'

'
    ActiveSheet.ListObjects("Table4").Range.AutoFilter Field:=25, Criteria1:= _
        "No"
End Sub
Sub showdrafted2()
Attribute showdrafted2.VB_ProcData.VB_Invoke_Func = " \n14"
'
' showdrafted2 Macro
'

'
    ActiveSheet.ListObjects("Table4").Range.AutoFilter Field:=25
End Sub
