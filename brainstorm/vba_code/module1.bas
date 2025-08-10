Attribute VB_Name = "Module1"


Sub ESPNRank()
Attribute ESPNRank.VB_ProcData.VB_Invoke_Func = " \n14"
'
' ESPNRank Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[ESPN Avg Price]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub ECR()
Attribute ECR.VB_ProcData.VB_Invoke_Func = " \n14"
'
' ECR Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[ECR]]"), SortOn:=xlSortOnValues, Order:= _
        xlAscending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub ESPNadp()
Attribute ESPNadp.VB_ProcData.VB_Invoke_Func = " \n14"
'
' ESPNadp Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[ESPN Price]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub ECRadp()
Attribute ECRadp.VB_ProcData.VB_Invoke_Func = " \n14"
'
' ECRadp Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[Yahoo Avg Price]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub



Sub Test()
Dim s As Shape
On Error Resume Next
For Each s In ActiveSheet.Shapes
s.Placement = xlMoveAndSize
Next
End Sub
