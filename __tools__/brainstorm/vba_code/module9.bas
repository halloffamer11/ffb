Attribute VB_Name = "Module9"
Sub ShowPickRounds()


        Range("H:W").EntireColumn.Hidden = False

 
        
        End Sub

Sub HidePickRounds()

    If Range("H4").Value < Range("V1").Value Then
        Columns("H").EntireColumn.Hidden = True
    Else
        Columns("H").EntireColumn.Hidden = False
    End If
      If Range("I4").Value < Range("V1").Value Then
        Columns("I").EntireColumn.Hidden = True
    Else
        Columns("I").EntireColumn.Hidden = False
    End If
      If Range("J4").Value < Range("V1").Value Then
        Columns("J").EntireColumn.Hidden = True
    Else
        Columns("j").EntireColumn.Hidden = False
    End If
      If Range("K4").Value < Range("V1").Value Then
        Columns("K").EntireColumn.Hidden = True
    Else
        Columns("K").EntireColumn.Hidden = False
    End If
      If Range("L4").Value < Range("V1").Value Then
        Columns("L").EntireColumn.Hidden = True
    Else
        Columns("L").EntireColumn.Hidden = False
    End If
      If Range("M4").Value < Range("V1").Value Then
        Columns("M").EntireColumn.Hidden = True
    Else
        Columns("M").EntireColumn.Hidden = False
    End If
      If Range("N4").Value < Range("V1").Value Then
        Columns("N").EntireColumn.Hidden = True
    Else
        Columns("N").EntireColumn.Hidden = False
    End If
          If Range("O4").Value < Range("V1").Value Then
        Columns("O").EntireColumn.Hidden = True
    Else
        Columns("O").EntireColumn.Hidden = False
    End If
      If Range("P4").Value < Range("V1").Value Then
        Columns("P").EntireColumn.Hidden = True
    Else
        Columns("P").EntireColumn.Hidden = False
    End If
          If Range("Q4").Value < Range("V1").Value Then
        Columns("Q").EntireColumn.Hidden = True
    Else
        Columns("Q").EntireColumn.Hidden = False
    End If
          If Range("R4").Value < Range("V1").Value Then
        Columns("R").EntireColumn.Hidden = True
    Else
        Columns("R").EntireColumn.Hidden = False
    End If
          If Range("S4").Value < Range("V1").Value Then
        Columns("S").EntireColumn.Hidden = True
    Else
        Columns("S").EntireColumn.Hidden = False
    End If
          If Range("T4").Value < Range("V1").Value Then
        Columns("T").EntireColumn.Hidden = True
    Else
        Columns("T").EntireColumn.Hidden = False
    End If
              If Range("U4").Value < Range("V1").Value Then
        Columns("U").EntireColumn.Hidden = True
    Else
        Columns("U").EntireColumn.Hidden = False
    End If
          If Range("V4").Value < Range("V1").Value Then
        Columns("V").EntireColumn.Hidden = True
    Else
        Columns("V").EntireColumn.Hidden = False
    End If
          If Range("W4").Value < Range("V1").Value Then
        Columns("W").EntireColumn.Hidden = True
    Else
        Columns("W").EntireColumn.Hidden = False
    End If
   
End Sub

