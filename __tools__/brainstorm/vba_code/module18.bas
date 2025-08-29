Attribute VB_Name = "Module18"
Sub SrtPrjAuct()
Attribute SrtPrjAuct.VB_ProcData.VB_Invoke_Func = " \n14"
'
' SrtPrjAuct Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[Prj $]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub ESPNauct()
Attribute ESPNauct.VB_ProcData.VB_Invoke_Func = " \n14"
'
' ESPNauct Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[ESPN $]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub NFLAuct()
Attribute NFLAuct.VB_ProcData.VB_Invoke_Func = " \n14"
'
' NFLAuct Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[NFL $]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub SkewSrt()
Attribute SkewSrt.VB_ProcData.VB_Invoke_Func = " \n14"
'
' SkewSrt Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[Skew]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
